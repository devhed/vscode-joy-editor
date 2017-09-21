import * as vscode from 'vscode';

export default class JoyEditorsSettings {
  private config = {};

  public constructor() {
    this.config = vscode.workspace.getConfiguration('joyeditor');
  }

  public get(key) {
    return this.config[key];
  }
}