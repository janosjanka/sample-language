// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="types.js" />
/// <reference path="lexer.js" />

"use strict";

/**
 * A recursive descent parser is a kind of top-down parser built from a set of mutually
 * recursive procedures (or a non-recursive equivalent) where each such procedure usually
 * implements one of the productions of the grammar. Thus the structure of the resulting program
 * closely mirrors that of the grammar it recognizes. More details:
 * 
 * https://en.wikipedia.org/wiki/Recursive_descent_parser
 */
class Parser {
    /**
     * Creates a new parser for the specified lexer.
     * @param  {Lexer} lexer The lexical analyzer.
     */
    constructor(lexer) {
        this.lexer = lexer;
        this.token = lexer.next();
    }

    /**
     * Returns true when the cursor is standing at the end of the source text.
     * @return {Boolean}
     */
    get isEOF() {
        return this.token.kind === SyntaxKind.EndOfFileToken;
    }

    /**
     * Builds up an AST (Abstract Syntax Tree) using the specified lexical analyzer.
     * @returns {ProgramDeclaration}
     */
    parse() {
        const program = this.parseProgram();
        this.lexer.reset();
        return program;
    }

    /**
     * Parses a factor of an expression. 
     */
    parseExpressionFactor() {
        switch (this.token.kind) {
            // Parse an invocation expression which can be used as an R-Value.
            case SyntaxKind.CallKeyword:
                return this.parseInvocationExpression();

            // Parses a literal expression to an LiteralSyntax syntax node. 
            case SyntaxKind.NumericLiteralToken:
                return new LiteralExpressionSyntax(SyntaxKind.NumericLiteralExpression, this.parseExpectedToken(this.token.kind));

            case SyntaxKind.StringLiteralToken:
                return new LiteralExpressionSyntax(SyntaxKind.StringLiteralExpression, this.parseExpectedToken(this.token.kind));

            // Parses an identifier expression to an IdentifierNameSyntax syntax node.
            case SyntaxKind.IdentifierToken:
                return new IdentifierNameSyntax(this.parseExpectedToken(SyntaxKind.IdentifierToken));

            // Parses a parenthesized ( ... ) expression to a parenthesized syntax node. 
            case SyntaxKind.OpenParenToken:
                return new ParenthesizedExpression(
                    this.parseExpectedToken(SyntaxKind.OpenParenToken),
                    this.parseExpression(),
                    this.parseExpectedToken(SyntaxKind.CloseParenToken));

            // Parses a unary +/- expression to a unary syntax node.
            case SyntaxKind.PlusToken:
            case SyntaxKind.MinusToken: {
                const operator = this.parseExpectedToken(this.token.kind);
                return new UnaryExpression(
                    operator.kind === SyntaxKind.PlusToken ? SyntaxKind.PlusToken : SyntaxKind.UnaryMinusExpression,
                    this.parseExpressionFactor(),
                    operator);
            }

            default:
                throw new SyntaxError(`An expression expected instead of the token '${this.token.kindText}'.`);
        }
    }

    /**
     * Parses a term expression.
     * @returns {Expression}
     */
    parseExpressionTerm() {
        // Parse the factor
        let expression = this.parseExpressionFactor();

        while (true) {
            switch (this.token.kind) {
                // * Mathematical multiplication expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseFactor() function again.
                case SyntaxKind.AsteriskToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.MultiplyExpression,  // multiply
                        expression,                     // left-hand-side expression
                        operator,                       // *
                        this.parseExpressionFactor());  // right-hand-side expression
                    break;
                }

                // / Mathematical division expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseFactor() function again.
                case SyntaxKind.SlashToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.DivideExpression,    // division
                        expression,                     // left-hand-side expression
                        operator,                       // /
                        this.parseExpressionFactor());  // right-hand-side expression
                    break;
                }

                default:
                    // Okay. There are no other expressions that should be evaluated.
                    return expression;
            }
        }
    }

    /**
     * Parses a single expression.
     * @returns {Expression}
     */
    parseExpression() {
        // Parse the left-hand-side of the expression.
        let expression = this.parseExpressionTerm();

        while (true) {
            switch (this.token.kind) {
                // + Mathematical addition expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseTerm() function again.
                case SyntaxKind.PlusToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.AddExpression,       // addition
                        expression,                     // left-hand-side expression
                        operator,                       // +
                        this.parseExpressionTerm());    // right-hand-side expression
                    break;
                }

                // - Mathematical substraction expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseTerm() function again.
                case SyntaxKind.MinusToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.SubtractExpression,  // substraction
                        expression,                     // left-hand-side expression
                        operator,                       // -
                        this.parseExpressionTerm());    // right-hand-side expression (recursive parsing)
                    break;
                }

                default:
                    // Okay. There are no other expressions that should be evaluated.
                    return expression;
            }
        }
    }

    /**
     * Parses a single function argument expression.
     * @returns {Expression} 
     */
    parseArgument() {
        return this.parseExpression();
    }

    /**
     * Parses a list of function argument expressions.
     * @returns {ArgumentListSyntax}
     */
    parseArguments() {
        const argumentList = [];

        // Parses all the arguments in a loop until we reach a semicolon ';'
        // or an End-Of-File (EOF) token. Each parsed argument node will be put
        // into the array 'args'.
        while (true) {
            // * Parse the current argument and add the result to the array.
            // * Is there another argument?
            // * Check whether this is the end of the argument list (;).
            argumentList.push(this.parseArgument());
            if (this.token.kind === SyntaxKind.VerticalBar) {
                this.parseExpectedToken(SyntaxKind.VerticalBar);
                continue;
            }
            if (this.token.kind === SyntaxKind.SemicolonToken ||
                this.token.kind === SyntaxKind.EndOfFileToken) {
                break;
            }
        }

        // Return an AST SyntaxNode representing an argument list.
        return new ArgumentListSyntax(argumentList);
    }

    /**
     * Parses a variable declaration statement.
     * @returns {VarDeclStatement}
     */
    parseVarDeclStatement() {
        const keyword = this.parseExpectedToken(SyntaxKind.LetKeyword);
        const identifier = new IdentifierNameSyntax(this.parseExpectedToken(SyntaxKind.IdentifierToken));
        const expression = this.parseOptionalToken(SyntaxKind.EqualsToken) && this.parseExpression();
        this.parseExpectedToken(SyntaxKind.SemicolonToken);

        // Return an AST SyntaxNode representing a variable declaration statement.
        return new VarDeclStatement(keyword, identifier, expression);
    }

    /**
     * Parses an invocation expression.
     * @returns {InvocationExpression}
     */
    parseInvocationExpression(checkSemicolon) {
        const keyword = this.parseExpectedToken(SyntaxKind.CallKeyword);
        const identifier = new IdentifierNameSyntax(this.parseExpectedToken(SyntaxKind.IdentifierToken));
        const argumentList = this.parseArguments();
        checkSemicolon && this.parseExpectedToken(SyntaxKind.SemicolonToken);

        // Return an AST SyntaxNode representing an invocation expression.
        return new InvocationExpression(keyword, identifier, argumentList);
    }

    /**
     * Parses an arbitrary kind of statements according to what is the current token's kind.
     * @returns {Statement}
     */
    parseStatement() {
        switch (this.token.kind) {
            case SyntaxKind.LetKeyword:
                return this.parseVarDeclStatement();
            case SyntaxKind.CallKeyword:
                return this.parseInvocationExpression(true);
            default:
                // Something is wrong. The user forgot to write at least command :-)
                throw new SyntaxError(`A statement expected instead of the token '${this.token.kindText}'.`);
        }
    }

    /**
     * Parses a block element { }. Since a block element can be nested into another block
     * element, we call this function in a recursive manner.
     * @returns {BlockSyntax} 
     */
    parseBlock() {
        const elements = [];

        this.parseExpectedToken(SyntaxKind.OpenBraceToken);
        while (true) {
            // Exit the 'while' loop because this is the end of this block.
            if (this.token.kind === SyntaxKind.CloseBraceToken) {
                break;
            }

            // Parse the nested block in a recursive way.
            if (this.token.kind === SyntaxKind.OpenBraceToken) {
                elements.push(this.parseBlock());
                continue;
            }

            // This means that this block has not been terminated and
            // we run out of the tokens.
            if (this.token.kind === SyntaxKind.EndOfFileToken) {
                throw new SyntaxError("Unterminated block.");
            }

            // Parse as statement.
            elements.push(this.parseStatement());
        }
        this.parseExpectedToken(SyntaxKind.CloseBraceToken);

        // Return an AST SyntaxNode that represents a block with its elements (children). 
        return new BlockSyntax(elements);
    }

    /**
     * Parses the whole program.
     * @returns {ProgramSyntax}
     */
    parseProgram() {
        this.skipWhiteSpace();

        const keyword = this.parseExpectedToken(SyntaxKind.ProgramKeyword);
        const identifier = new IdentifierNameSyntax(this.parseExpectedToken(SyntaxKind.IdentifierToken));
        const block = this.parseBlock();

        // Eat the End-Of-File (EOF) token.
        this.parseExpectedToken(SyntaxKind.EndOfFileToken);

        return new ProgramSyntax(keyword, identifier, block);
    }

    /** Skips all of the white-space tokens until it runs out. */
    skipWhiteSpace() {
        while ((this.token.kind === SyntaxKind.WhiteSpaceTrivia
            || this.token.kind === SyntaxKind.EndOfLineToken)
            && this.token.kind !== SyntaxKind.EndOfFileToken) {
            this.token = this.lexer.next();
        }
    }

    /** Moves the cursor to the next token within the source text. */
    nextToken() {
        this.token = this.lexer.next();
        this.skipWhiteSpace();
    }

    /**
     * Moves the cursor to the next token if that matches the specified syntax kind.
     * @param {SyntaxKind} syntaxKind Kind of the lexical element to be checked.
     * @returns {SyntaxToken} The previous token.
     */
    parseOptionalToken(syntaxKind) {
        if (this.token.kind === syntaxKind) {
            const token = this.token;
            this.nextToken();
            return token;
        }
        return void 0;
    }

    /**
     * Moves the cursor to the next token if that matches the specified syntax kind;
     * otherwise, it throws a syntax error (unexpected token) exception.
     * @param {SyntaxKind} syntaxKind Kind of the lexical element to be checked.
     * @returns {SyntaxToken} The previous token.
     */
    parseExpectedToken(syntaxKind) {
        const token = this.parseOptionalToken(syntaxKind);
        if (token) {
            return token;
        }
        throw new SyntaxError(`${SyntaxKind[syntaxKind]} expected instead of the token '${this.token.kindText}'.`);
    }
}