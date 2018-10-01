// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="../language/types.js" />

"use strict";

//
// Defines all the lexical elements of the language for syntax highlighting
// using an open source code editor, such as CodeMirror (see: https://codemirror.net)
//

CodeMirror.defineSimpleMode("sample", {
    start: [
        { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
        { regex: new RegExp("(?:" + Object.keys(KeywordSyntaxKindMap).join("|") + ")\\b"), token: "keyword" },
        { regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "number" },
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ$][\w$]*/, token: "variable" }
    ]
});

/**
 * Represents a UI code editor for the language.
 */
class CodeEditor {
    /**
     * Initializes a new instance of the code editor.
     * @param  {HTMLElement} element The element which will host the code editor.
     */
    constructor(element, language) {
        this.element = element;
        this.editor = CodeMirror.fromTextArea(this.element, {
            mode: language,
            theme: "visual-studio"
        });
    }

    /**
     * Gets the current value of the source code editor.
     * @return {string}
     */
    get value() {
        return this.editor.getValue();
    }

    /**
     * Sets the specified value for the source code editor.
     * @param  {string} value
     */
    set value(value) {
        this.editor.setValue(value);
    }
}
