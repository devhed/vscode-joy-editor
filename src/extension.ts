'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { JoyEditorProvider } from './providers/joyEditorProvider';
import JoyEditorsSettings from './common/configSettings';

export function activate(context: vscode.ExtensionContext) {

  const settings = new JoyEditorsSettings();

  const socketOptions = {
    hostname: settings.get('hostname'),
    port: settings.get('socketOptions'),
  };

  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(
    'joy-editor', new JoyEditorProvider(socketOptions)));

  const devtoolsUri = vscode.Uri.parse('joy-editor://authority/JoyEditor');
  
  context.subscriptions.push(vscode.commands.registerCommand('extension.openJoyEditor', () => {
    return vscode.commands.executeCommand(
      'vscode.previewHtml',
      devtoolsUri,
      vscode.ViewColumn.Two
    ).then((success) => {
      console.log('starting joy editor')
    }, (reason) => {
      vscode.window.showErrorMessage(reason);
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('extension.startRemotedevServer', () => {
    return new Promise((resolve, reject) => {
      resolve();
    }).then(() => console.log('remotedev start successfully'));
  }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}