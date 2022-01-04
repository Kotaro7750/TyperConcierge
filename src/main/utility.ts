import { app, dialog } from 'electron';

export function fatalErrorAndExit(err: Error): void {
  dialog.showErrorBox('Error', err.toString())
  app.exit();
}
