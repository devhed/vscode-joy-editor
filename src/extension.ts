'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { JoyEditorProvider } from './providers/joyEditorProvider';
import JoyEditorsSettings from './common/configSettings';

export function activate(context: vscode.ExtensionContext) {
  const joyEditorUri = vscode.Uri.parse('joy-editor://authority/JoyEditor');
  
   if (typeof vscode.window.activeTextEditor == 'undefined') {
    vscode.window.showErrorMessage("Active editor doesn't show a JOY script - please open one and/or relaunch the Joy Editor extension.");
  }

  const settings = new JoyEditorsSettings();

  const socketOptions = {
    hostname: settings.get('hostname'),
    port: settings.get('socketOptions'),
  };

  let provider = new JoyEditorProvider(socketOptions);
	let registration = vscode.workspace.registerTextDocumentContentProvider('joy-editor', provider);
  context.subscriptions.push(registration);
  
	// vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
	// 	if (e.document === vscode.window.activeTextEditor.document && typeof provider !== 'undefined') {
	// 		provider.update(joyEditorUri);
	// 	}
	// });

	vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
		if (e.textEditor === vscode.window.activeTextEditor && typeof provider !== 'undefined'       
      && e.textEditor.document.fileName.endsWith('joy') && provider.getProviderHtml().trim().startsWith('<body>')) {
        provider.update(joyEditorUri);
      }
	})

  let cmdOpenJoyEditor = vscode.commands.registerCommand('extension.openJoyEditor', () => {
    return vscode.commands.executeCommand(
      'vscode.previewHtml',
      joyEditorUri,
      vscode.ViewColumn.Two
    ).then((success) => {
      console.log(`starting joy editor`)
    }, (reason) => {
      vscode.window.showErrorMessage(reason);
    });
  });
  context.subscriptions.push(cmdOpenJoyEditor, registration);

  let cmdReloadJoyEditor = vscode.commands.registerCommand('extension.reloadJoyEditor', () => {
		if (typeof provider !== 'undefined') {
      console.log('do it!');
      // provider.update(joyEditorUri);
    }
  });
  context.subscriptions.push(cmdOpenJoyEditor, registration);

  let cmdStartRemoteDevServer = vscode.commands.registerCommand('extension.startRemotedevServer', () => {
    return new Promise((resolve, reject) => {
      resolve();
    }).then(() => console.log('remotedev start successfully'));
  });
  context.subscriptions.push(cmdStartRemoteDevServer, registration);
}

export function deactivate() {
  console.log('deactivate');
}