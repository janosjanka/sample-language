// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="language/types.js" />
/// <reference path="language/lexer.js" />
/// <reference path="language/parser.js" />
/// <reference path="language/emitter.js" />

/// <reference path="designer/editor.js" />

"use strict";

/**
 * This class/type represents an application that describes visual user interface (UI) elements
 * and event handlers (user action handler functions).
 */
class Application {
    /**
     * Initializes a new instance of the Application class.
     * @param {Object} options
     */
    constructor(options) {
        this.$codeEditor = options.codeEditor;
        this.codeEditor = new CodeEditor($("textarea:first", this.$codeEditor).val(options.codeSample)[0], "sample");
        $("button[name='compile']", this.$codeEditor).on("click", this.onCompile.bind(this));
        $("button[name='compile_run']", this.$codeEditor).on("click", this.onCompileAndRun.bind(this));
        this.$codeEditor.submit(this.onCompileAndRun.bind(this));
        this.$messageOutput = options.messageOutput;
        this.$lexerOutput = options.lexerOutput;
        this.$syntaxOutput = options.syntaxOutput;
        this.$emitterOutput = options.emitterOutput;
        this.emitterOutput = new CodeEditor(this.$emitterOutput[0], "javascript");
        this.$syntaxOutput.fancytree({ minExpandLevel: 100, icons: false, source: [] });
    }

    /**
     * Occurs when the user clicks the button 'Compile'.
     * @param {Event} event
     */
    onCompile(event) {
        event.preventDefault();
        this.compile();
    }

    /**
     * Occurs when the user clicks the button 'Compile & Run'.
     * @param {Event} event
     */
    onCompileAndRun(event) {
        event.preventDefault();
        this.run(this.compile());
    }

    /**
     * Compiles the Sample source text building up an AST
     * and then translating the result tree into JavaScript.
     */
    compile() {
        let outputCode = "";
        this.$messageOutput.removeClass("alert-success alert-danger").empty();
        try {
            // Collect all the lexical elements from the raw source text
            // and display those on the user interface (UI).
            const lexer = new Lexer(this.codeEditor.value);
            this.showSyntaxList(lexer);

            // Build up an AST (Abstract Syntax Tree) from the lexical elements
            // and display the result on the user interface (UI).
            this.emptySyntaxTree();
            const parser = new Parser(lexer);
            const syntaxTree = parser.parse();
            this.showSyntaxTree(syntaxTree);

            // Emit JavaScript code traversing the syntax tree
            // and display the code on the user interface (UI).
            const emitter = new Emitter();
            outputCode = emitter.emit(syntaxTree);
            this.showOutputCode(outputCode);

            // Okay. Everything is alright.
            this.$messageOutput.addClass("alert-success").text("Compilation succeeded.");
        } catch (ex) {
            // Ooops! Something is wrong.
            this.$messageOutput.addClass("alert-danger").text(ex.toString());
            throw ex;
        }
        return outputCode;
    }

    /**
     * Lists all syntax elements on the user interfaces.
     * @param  {Lexer} lexer
     */
    showSyntaxList(lexer) {
        this.$lexerOutput.html(`
<div class="row">
    <div class="col-md-6"><strong>Source Text</strong></div>
    <div class="col-md-6"><strong>Syntax Kind</strong></div>
</div>`);

        while (true) {
            const token = lexer.next();
            const classes = this.getSyntaxClasses(token);

            this.$lexerOutput.append(`
<div class="row" class="${this.getSyntaxClasses(token)}">
    <div class="col-md-6 ${classes}">${token.text}</div>
    <div class="col-md-6 ${classes}">${token.kindText}</div>
</div>`);

            // We do it because we want to display the EOF token too.
            if (token.kind === SyntaxKind.endOfFileToken) {
                break;
            }
        }

        lexer.reset();
    }

    /**
     * Runs the specified JavaScript code.
     * @param  {string} code
     */
    run(code) {
        try {
            // Call the eval (evaluate) function of the JavaScript runtime
            // to run the translated (emitted) code.
            eval(code);
        } catch (ex) {
            // Ooops! Something is wrong.
            this.$messageOutput
                .removeClass("alert-success alert-danger")
                .addClass("alert-danger")
                .text(ex.toString());
            throw ex;
        }
    }

    /**
     * Builds a visual syntax tree traversing the compiled syntax tree. 
     * @param  {SyntaxNode} The syntax node to traverse.
     */
    showSyntaxTree(syntaxNode) {
        const that = this;
        this.$syntaxOutput.fancytree("option", "source", [(function mapNode(node) {
            return {
                children: node.isToken ? null : node.children.map(mapNode),
                extraClasses: that.getSyntaxClasses(node),
                title: node.isToken ? node.text : node.kindText,
            };
        })(syntaxNode)]);
    }

    /**
     * Removes all nodes from the tree creating an empty tree.
     */
    emptySyntaxTree() {
        this.$syntaxOutput.fancytree("option", "source", []);
    }

    /**
     * Writes the output code to the standard output.
     * @param  {string} outputCode
     */
    showOutputCode(outputCode) {
        this.emitterOutput.value = outputCode;
    }

    /**
     * Gets CSS classes for the specified syntax element.
     * @param   {SyntaxToken | SyntaxNode} node
     * @returns {string}
     */
    getSyntaxClasses(node) {
        const classes = [];
        node.isToken && classes.push("syn-token");
        node.isKeyword && classes.push("syn-keyword");
        classes.push(`syn-${node.kindText.toLowerCase()}`);
        return classes.join(" ");
    }
}