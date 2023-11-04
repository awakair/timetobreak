import * as vscode from 'vscode';

const MINUTE = 60000;
let timerMinutesDuration: number = 15;
let timer: ReturnType<typeof setInterval> | null = null;
let timerMinutesLeft: number = timerMinutesDuration;
let statusBarDisposableMessage: vscode.Disposable;
let working: boolean = false;

export function activate(context: vscode.ExtensionContext) {

	let changeWorkTime = vscode.commands.registerCommand('timetobreak.changeworktime', setTimerMinutesDuration);
	let startCoding = vscode.commands.registerCommand('timetobreak.startcoding', startTimer);
	let stopCoding = vscode.commands.registerCommand('timetobreak.stopcoding', showStopCoding);
	let killBreakTimer = vscode.commands.registerCommand('timetobreak.killbreaktimer', stopTimer);

	context.subscriptions.push(changeWorkTime);
	context.subscriptions.push(startCoding);
	context.subscriptions.push(stopCoding);
}

export function deactivate() {}

function setTimerMinutesDuration(): void {
	let options:  vscode.InputBoxOptions = {title: "Time between breaks", prompt: "Minutes", value: "15"};
	vscode.window.showInputBox(options).then((result) => {
		let minutes = parseInt(result ?? "0");
		if (minutes < 5 || minutes > 35) {
			const header = "Bad time";
			const options: vscode.MessageOptions = { detail: "Too small or too big time, reenter another", modal: true};
			const ok: vscode.MessageItem = {title: "OK",  isCloseAffordance: true };
			vscode.window.showInformationMessage(header, options, ok).then((item)=>{
				setTimerMinutesDuration();
			});
			return;
		}
		timerMinutesDuration = minutes;
		timerMinutesLeft = timerMinutesDuration;
	});
	
}

async function startTimer(): Promise<void> {
	if (timer !== null) {
		const header: string = "Starting timer again";
		const options: vscode.MessageOptions = { detail: "Timer is already working", modal: true};
		const ok: vscode.MessageItem = {title: "OK",  isCloseAffordance: true };
		vscode.window.showInformationMessage(header, options, ok);
		return;
	}
	working = true;
    updateTimer();
    timer = setInterval(updateTimer, MINUTE);
}

async function stopTimer(): Promise<void> {
	if (timer !== null) {
		clearInterval(timer);
		timer = null;
		timerMinutesLeft = timerMinutesDuration;
		if (statusBarDisposableMessage) {
			statusBarDisposableMessage.dispose();
		}
	}
}

async function updateTimer(): Promise<void> {
	if (timerMinutesLeft === 0) {
		await showTimeToBreak();
		return;
	}
	if (timerMinutesLeft * 2 === timerMinutesDuration) {
		vscode.window.showWarningMessage("Dont't fordet to drink water!");
	}
	if (statusBarDisposableMessage) {
		statusBarDisposableMessage.dispose();
	}
	statusBarDisposableMessage = vscode.window.setStatusBarMessage(`You should take a break in ${timerMinutesLeft} minutes`);
	timerMinutesLeft--;
}

async function showTimeToBreak(): Promise<void> {
	await stopTimer();

	const header = "Time to take a break";
	const options: vscode.MessageOptions = { detail: "It's time to take a break for 5-10 minutes!", modal: true};
	const give_me_five_minutes: vscode.MessageItem = {title: "Give me five more minutes",  isCloseAffordance: true };
	const ok: vscode.MessageItem = {title: "OK",  isCloseAffordance: false };
	vscode.window.showInformationMessage(header, options, ...[give_me_five_minutes, ok]).then(async (item)=>{
		if (item === give_me_five_minutes) {
			timerMinutesLeft = 5;
			await startTimer();
		} else {
			await showStopCoding();
		}
	});
}

async function showStopCoding(): Promise<void> {
	await stopTimer();

	statusBarDisposableMessage = vscode.window.setStatusBarMessage("Relax");

	const header = "Stop coding";
	const options: vscode.MessageOptions = { detail: "Warm up or go for a little walk and then press OK", modal: true};
	const ok: vscode.MessageItem = {title: "OK",  isCloseAffordance: true };
	vscode.window.showInformationMessage(header, options, ok).then(async ()=>{
		await startTimer();
	});
}
