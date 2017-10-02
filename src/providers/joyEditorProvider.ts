import * as vscode from 'vscode';
import * as path from 'path';
const fs = require('fs');

var _joyExtension = "joy";
var _providerHtml = "";

type socketOptions = {
  hostname: string
  port: number
}

export class JoyEditorProvider implements vscode.TextDocumentContentProvider {
  
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  
  /**
   * Socket Options (optional)
   */
  private socketOptions = {
    hostname: '127.0.0.1',
    port: 1024,
  };

  /**
   * Constructor.
   * 
   * @param options - socket options
   */
  public constructor(options: socketOptions) {
    this.socketOptions = options;
  }

  /**
   * Function that provides the text document content.
   * 
   * @param uri - provided file uri
   */
  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.createJoyEditorPreview(uri);
  }

  /**
   * Function invoked after changes on made to the provided text document content.
   */
  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  /**
   * Update Callback.
   * 
   * @param uri - provided file uri
   */
  public update(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  /**
   * Create the Joy Editor Preview.
   * 
   * @param uri - provided file uri
   */
  public createJoyEditorPreview(uri: vscode.Uri): string {
    const reason = "Active editor doesn't show a JOY script - please open one and/or relaunch the Joy Editor extension.";
    if(typeof vscode.window.activeTextEditor === 'undefined' || !vscode.window.activeTextEditor.document.fileName.endsWith(_joyExtension)){
      _providerHtml = this.errorPreview(reason);
      return _providerHtml
    }
      return this.joyEditorPreview(uri);
  }

  /**
   * Parse a joy file into memory. This function will return a string that includes a root joy file and
   * all of its referenced libload library files.
   * 
   * If the root joy file references other joy files (via the libload keyword) those strinified files will replace its
   * libload declaration line.
   * 
   * @param str - concatenated joy file represented as a string
   * @param filename - the root joy file to parse
   */
  private recursiveLibloadParseAsString(str, filename) : string {
    console.log(`parsing file: ${filename}`);
    
    var filePath = vscode.window.activeTextEditor.document.fileName.substring(0, filename.lastIndexOf(path.sep)) + path.sep;    

    if (fs.existsSync (filename)) {
      var rawFile = fs.readFileSync(filename, 'utf8');
      var strFile = JSON.stringify(rawFile, null, 4);
      var pattern = /(?!^)"([\w+]|[.]+)+.*?"(\s+)(libload)(\s?)./g;
      var oldLibMatch = str.match(pattern);     
      var newlibMatch = strFile.match(pattern);
      str = (str === '') ? strFile : str.replace(pattern, strFile);

      if(newlibMatch !== null && typeof newlibMatch !== 'undefined'){
        newlibMatch.forEach((a) => {
          var lib = a.match(/(^)".*?"/g);
          if(lib !== null && typeof lib !== 'undefined' && lib.length > 0){
            str = this.recursiveLibloadParseAsString(str, filePath + lib[0].trim().replace(/^"(.*)\\"$/g, '$1') + '.' + _joyExtension);
          }
        });
      }      
    }

    return str;
  }

  /**
   * Parse a joy file into memory. This function will return an array of joy files represented as strings.
   * If the root joy file references other joy files (via the libload keyword) those files will are added
   * to the array via recursion.
   * 
   * @param array - array of joy files represented as strings
   * @param filename - the root joy file to parse
   */
  private recursiveLibloadParseAsArray(array, filename) : string[]{
    console.log(`parsing file: ${filename}`);
    
    var filePath = vscode.window.activeTextEditor.document.fileName.substring(0, filename.lastIndexOf(path.sep)) + path.sep;    

    if (fs.existsSync (filename)) {
      var rawFile = fs.readFileSync(filename, 'utf8');
      var strFile = JSON.stringify(rawFile, null, 4);
      
      array.push(strFile);
      var pattern = /(?!^)"([\w+]|[.]+)+.*?"(\s+)(libload)(\s?)./g;
      var newlibMatch = strFile.match(pattern);

      if(newlibMatch !== null && typeof newlibMatch !== 'undefined'){
        newlibMatch.forEach((a) => {
          var lib = a.match(/(^)".*?"/g);
          if(lib !== null && typeof lib !== 'undefined' && lib.length > 0){
            return this.recursiveLibloadParseAsArray(array, filePath + lib[0].trim().replace(/^"(.*)\\"$/g, '$1') + '.' + _joyExtension);
          }
        });
      }      
    }

    return array;
  }

  /**
   * Create the Joy Editor extension as a preview tab within vscode.
   * 
   * @param uri - provided file uri
   */
  private joyEditorPreview(uri: vscode.Uri): string {

    var relativePath = path.dirname(__dirname);
    var filename = vscode.window.activeTextEditor.document.fileName;

    var str = this.recursiveLibloadParseAsString('', filename);
    console.log(str);

    _providerHtml = `
    <head>
        <title>Be Brief!</title>
        <script type="text/javascript" src="${relativePath}/../../assets/joyEditor/js/jquery.min.js"></script>        
        <link rel="Stylesheet" href="${relativePath}/../../assets/joyEditor/css/Default.css" type="text/css" />
        <link rel="Stylesheet" href="${relativePath}/../../assets/joyEditor/css/Editor.css" type="text/css" />
        <script type="text/javascript" src="${relativePath}/../../assets/joyEditor/js/test.js"></script>                
        <script type="text/javascript" src="${relativePath}/../../assets/joyEditor/js/Engine.js"></script>
        <script type="text/javascript" src="${relativePath}/../../assets/joyEditor/js/Editor.js"></script>
        <script>
        /* When the user clicks on the button,
        toggle between hiding and showing the dropdown content */
        function myFunction() {
            document.getElementById("dropdown-dictionary").classList.toggle("show");
        }
        
        function filterFunction() {
            var input, filter, ul, li, a, i;
            input = document.getElementById("dropdown-search");
            filter = input.value.toUpperCase();
            div = document.getElementById("dropdown-dictionary");
            a = div.getElementsByTagName("a");
            for (i = 0; i < a.length; i++) {
                if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
                    a[i].style.display = "";
                } else {
                    a[i].style.display = "none";
                }
            }
        }

        // Close the dropdown if the user clicks outside of it
        window.onclick = function(event) {
          console.log(JSON.stringify(event.target));
          if (!event.target.matches('.dropbtn')) {
        
            if(event.target.matches('.drop-input')) {
              console.log('.drop-input found!');
              event.target.focus();
              event.preventDefault();              
              return;
            } else if (event.target.matches('.drop-element')) {
              console.log('.drop-element found!');
              // event.target.focus();
              return;              
            }

            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
              var openDropdown = dropdowns[i];
              console.log(i);
              if (openDropdown.classList.contains('show')) {
                console.log(openDropdown);
                openDropdown.classList.remove('show');
              }
            }
          }
        }
        </script>
        <script type="text/brief">
        </script>
    </head>
    <body>
        <h1>Joy Editor</h1>
        <div id="demo"></div>
        <hr />
        <div class="title-container">
          <div class="title-header">Interactive Editor</div>        
          <div id="input"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Stack Results</div>  
          <div id="context"></div>
        </div>
        <hr />        
        <div class="title-container">
          <div class="title-header">Dictionary Definitions</div>        
          <div id="dictionary"></div>
        </div>
        <hr />                
        <div class="title-container">
          <div class="title-header">Raw Text</div>        
          <div id="output"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Error Console</div>        
          <div id="error"></div>
        </div>
        <hr />
        <div class="title-container">
          <div class="title-header">Dictionary Explorer</div>        
          <div class="dropdown">
          <div class="container">          
            <button onclick="myFunction()" class="dropbtn">Dictionary</button>
            <div id="dropdown-dictionary" class="dropdown-content">
              <input id="dropdown-search" class="drop-input" type="text" placeholder="Search.." onkeyup="filterFunction()">
              <a class="drop-element" href="#about">About</a>
              <a class="drop-element" href="#base">Base</a>
              <a class="drop-element" href="#blog">Blog</a>
              <a class="drop-element" href="#contact">Contact</a>
              <a class="drop-element" href="#custom">Custom</a>
              <a class="drop-element" href="#support">Support</a>
              <a class="drop-element" href="#tools">Tools</a>
            </div>
            <div id="element-defintion"><span>hi</span></div>          
          </div>                        
        </div>
        </div>
        <hr />
        <h2><a target="_blank" href="http://youtu.be/R3MNcA2dpts?hd=1">Demo based off forked "Be Brief!" Editor</a></h2>
        <p>Forked from <a target="_blank" href="https://github.com/AshleyF/brief">"Be Brief!" Editor (@author AshleyF)</a></p>
        <ul>
            <li>Use the "words" to discover available word commands and functions</li>
            <li>Arrow keys to move cursor (CTRL+arrows to skip quotations)</li>
            <li>Hold Shift to select while moving</il>
            <li>CTRL-Q quotes selection</li>
            <li>Square brackets for quotations</li>
            <li>Double quotes for strings</li>
        </ul>
    </body>`;
    return _providerHtml;
  }

  /**
   * Get the HTML markup.
   */
  public getProviderHtml(): string {
    return _providerHtml;
  }

  /**
   * Construct html markup based on a error message.
   * 
   * @param error - error message
   */
  private errorPreview(error: string): string {
    return `
      <body>
        ${error}
      </body>`;
  }
}