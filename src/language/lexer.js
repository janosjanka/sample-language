// Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="utils.js" />
/// <reference path="types.js" />

"use strict";

class Lexer {
    /**
     * Creates a new instance of the lexer for the specified source text. 
     * @param  {string} source The source text to lex.
     */
    constructor(source) {
        this.source = source || "";
        this.pos = 0;
        this.lastPos = this.source.length - 1;
    }

    /**
     * Returns true when the cursor is standing at the end of the source text.
     * @return {Boolean}
     */
    get isEOF() {
        return this.pos > this.lastPos;
    }

    /**
     * Returns the next token at the current position.
     * @return {SyntaxToken}
     */
    next() {
        const token = new SyntaxToken();

        // Check whether the cursor is standing at the end of the source text.
        if (this.pos > this.lastPos) {
            token.kind = SyntaxKind.endOfFileToken;
            return token;
        }

        let ch;
        switch (ch = this.source.charCodeAt(this.pos)) {
            case CharCodes.lineFeed:
            case CharCodes.carriageReturn:
                this.scanEndOfLine(token);
                break;

            case CharCodes.tab:
            case CharCodes.verticalTab:
            case CharCodes.formFeed:
            case CharCodes.space:
                this.scanWhiteSpaceTrivia(token);
                break;

            case CharCodes.doubleQuote:
            case CharCodes.singleQuote:
                this.scanStringLiteral(token);
                break;

            case CharCodes.semicolon:
                this.pos++;
                token.kind = SyntaxKind.semicolonToken;
                token.text = ";";
                break;

            case CharCodes.plus:
                this.pos++;
                token.kind = SyntaxKind.plusToken;
                token.text = "+";
                break;

            case CharCodes.minus:
                this.pos++;
                token.kind = SyntaxKind.minusToken;
                token.text = "-";
                break;

            case CharCodes.asterisk:
                this.pos++;
                token.kind = SyntaxKind.asteriskToken;
                token.text = "*";
                break;

            case CharCodes.slash:
                this.pos++;
                token.kind = SyntaxKind.slashToken;
                token.text = "/";
                break;

            case CharCodes.openParen:
                this.pos++;
                token.kind = SyntaxKind.openParenToken;
                token.text = "(";
                break;

            case CharCodes.closeParen:
                this.pos++;
                token.kind = SyntaxKind.closeParenToken;
                token.text = ")";
                break;

            case CharCodes.openBrace:
                this.pos++;
                token.kind = SyntaxKind.openBraceToken;
                token.text = "{";
                break;

            case CharCodes.closeBrace:
                this.pos++;
                token.kind = SyntaxKind.closeBraceToken;
                token.text = "}";
                break;

            case CharCodes.a:
            case CharCodes.b:
            case CharCodes.c:
            case CharCodes.d:
            case CharCodes.e:
            case CharCodes.f:
            case CharCodes.g:
            case CharCodes.h:
            case CharCodes.i:
            case CharCodes.j:
            case CharCodes.k:
            case CharCodes.l:
            case CharCodes.m:
            case CharCodes.n:
            case CharCodes.o:
            case CharCodes.p:
            case CharCodes.q:
            case CharCodes.r:
            case CharCodes.s:
            case CharCodes.t:
            case CharCodes.u:
            case CharCodes.v:
            case CharCodes.w:
            case CharCodes.x:
            case CharCodes.y:
            case CharCodes.z:

            case CharCodes.á:
            case CharCodes.é:
            case CharCodes.í:
            case CharCodes.ó:
            case CharCodes.ö:
            case CharCodes.ő:
            case CharCodes.ú:
            case CharCodes.ü:
            case CharCodes.ű:

            case CharCodes.A:
            case CharCodes.B:
            case CharCodes.C:
            case CharCodes.D:
            case CharCodes.E:
            case CharCodes.F:
            case CharCodes.G:
            case CharCodes.H:
            case CharCodes.I:
            case CharCodes.J:
            case CharCodes.K:
            case CharCodes.L:
            case CharCodes.M:
            case CharCodes.N:
            case CharCodes.O:
            case CharCodes.P:
            case CharCodes.Q:
            case CharCodes.R:
            case CharCodes.S:
            case CharCodes.T:
            case CharCodes.U:
            case CharCodes.V:
            case CharCodes.W:
            case CharCodes.X:
            case CharCodes.Y:
            case CharCodes.Z:

            case CharCodes.Á:
            case CharCodes.É:
            case CharCodes.Í:
            case CharCodes.Ó:
            case CharCodes.Ö:
            case CharCodes.Ő:
            case CharCodes.Ú:
            case CharCodes.Ü:
            case CharCodes.Ű:

            case CharCodes._:
                this.scanIdentifierOrKeyword(token);
                break;

            case CharCodes._0:
            case CharCodes._1:
            case CharCodes._2:
            case CharCodes._3:
            case CharCodes._4:
            case CharCodes._5:
            case CharCodes._6:
            case CharCodes._7:
            case CharCodes._8:
            case CharCodes._9:
                this.scanNumericLiteral(token);
                break;

            default:
                this.pos++;
                break;
        }

        return token;
    }

    /**
     * Resets the lexer moving the cursor to the first character.
     */
    reset() {
        this.pos = 0;
    }

    /**
     * Scans all of the End-Of-Line characters until it runs out.
     * @param  {SyntaxToken} token
     */
    scanEndOfLine(token) {
        this.pos += this.source.charCodeAt(this.pos) === CharCodes.carriageReturn
            && this.source.charCodeAt(this.pos + 1) === CharCodes.lineFeed ? 2 : 1;
        token.kind = SyntaxKind.endOfLineToken;
    }

    /**
     * Scans all of the white-space characters until it runs out.
     * @param  {SyntaxToken} token
     */
    scanWhiteSpaceTrivia(token) {
        const tokenStartPos = this.pos++;
        while (this.pos <= this.lastPos && StrUtils.isWhiteSpaceSingleLine(this.source.charCodeAt(this.pos))) this.pos++;
        token.kind = SyntaxKind.whiteSpaceTrivia;
        token.text = this.source.substring(tokenStartPos, this.pos);
    }

    /**
     * Scans all of the digits until it runs out.
     * @param  {SyntaxToken} token
     */
    scanNumericLiteral(token) {
        const tokenStartPos = this.pos++;
        while (this.pos <= this.lastPos && StrUtils.isDigit(this.source.charCodeAt(this.pos))) this.pos++;
        if (this.source.charCodeAt(this.pos) === CharCodes.dot) {
            this.pos++;
            while (this.pos <= this.lastPos && StrUtils.isDigit(this.source.charCodeAt(this.pos))) this.pos++;
        }
        token.kind = SyntaxKind.numericLiteralToken;
        token.text = this.source.substring(tokenStartPos, this.pos);
        token.value = +token.text;
    }

    /**
     * Scans all of the string literal characters until it runs out.
     * @param  {SyntaxToken} token
     */
    scanStringLiteral(token) {
        const openQuoteChar = this.source.charCodeAt(this.pos);
        const tokenStartPos = this.pos++;
        while (this.pos <= this.lastPos && this.source.charCodeAt(this.pos) !== openQuoteChar) this.pos++;
        if (this.pos > this.lastPos) throw new SyntaxError("Unterminated string literal.");
        this.pos++;
        token.kind = SyntaxKind.stringLiteralToken;
        token.text = this.source.substring(tokenStartPos, this.pos);
        token.value = this.source.substring(tokenStartPos + 1, this.pos - 1);
    }

    /**
     * Scans all of the identifier or keyword tokens until it runs out.
     * @param  {SyntaxToken} token
     */
    scanIdentifierOrKeyword(token) {
        const firstChar = this.source.charCodeAt(this.pos);
        const tokenStartPos = this.pos++;
        while (this.pos <= this.lastPos && StrUtils.isIdentifierPart(this.source.charCodeAt(this.pos))) this.pos++;
        token.text = token.value = this.source.substring(tokenStartPos, this.pos);
        token.kind = KeywordSyntaxKindMap[token.text];
        if (!token.kind) {
            if (!StrUtils.isIdentifierStartPart(firstChar)) {
                throw new SyntaxError(`Invalid identifier: '${token.text}'.`);
            }
            token.kind = SyntaxKind.identifierToken;
        }
    }
}