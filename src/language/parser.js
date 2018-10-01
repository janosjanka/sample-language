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
        return this.token.kind === SyntaxKind.endOfFileToken;
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
            // Parses a literal expression to an LiteralSyntax syntax node. 
            case SyntaxKind.numericLiteralToken:
                return new LiteralExpressionSyntax(SyntaxKind.numericLiteralExpression, this.eatToken(this.token.kind));

            case SyntaxKind.stringLiteralToken:
                return new LiteralExpressionSyntax(SyntaxKind.stringLiteralExpression, this.eatToken(this.token.kind));

            // Parses an identifier expression to an IdentifierNameSyntax syntax node.
            case SyntaxKind.identifierToken:
                return new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));

            // Parses a parenthesized ( ... ) expression to a parenthesized syntax node. 
            case SyntaxKind.openParenToken:
                return new ParenthesizedExpression(
                    this.eatToken(SyntaxKind.openParenToken),
                    this.parseExpression(),
                    this.eatToken(SyntaxKind.closeParenToken));

            // Parses a unary +/- expression to a unary syntax node.
            case SyntaxKind.plusToken:
            case SyntaxKind.minusToken: {
                const operator = this.eatToken(this.token.kind);
                return new UnaryExpression(
                    operator.kind === SyntaxKind.plusToken ? SyntaxKind.plusToken : SyntaxKind.unaryMinusExpression,
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
                case SyntaxKind.asteriskToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.multiplyExpression,  // multiply
                        expression,                     // left-hand-side expression
                        operator,                       // *
                        this.parseExpressionFactor());  // right-hand-side expression
                    break;
                }

                // / Mathematical division expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseFactor() function again.
                case SyntaxKind.slashToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.divideExpression,    // division
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
                case SyntaxKind.plusToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.addExpression,       // addition
                        expression,                     // left-hand-side expression
                        operator,                       // +
                        this.parseExpressionTerm());    // right-hand-side expression
                    break;
                }

                // - Mathematical substraction expression
                // At this point we already parsed the left-hand-side of the expression,
                // the right-hand-side of the expression will be parsed calling the parseTerm() function again.
                case SyntaxKind.minusToken: {
                    const operator = this.token;
                    this.nextToken();
                    expression = new BinaryExpression(
                        SyntaxKind.subtractExpression,  // substraction
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
            if (this.token.kind === SyntaxKind.andKeyword) {
                this.eatToken(SyntaxKind.andKeyword);
                continue;
            }
            if (this.token.kind === SyntaxKind.semicolonToken ||
                this.token.kind === SyntaxKind.endOfFileToken) {
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
        const letKeyword = this.eatToken(SyntaxKind.letKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const expression = this.parseExpression();

        // Eat the semicolon (;) token at the end of the statement.
        this.eatToken(SyntaxKind.semicolonToken);

        // Return an AST SyntaxNode representing a variable declaration statement.
        return new VarDeclStatement(letKeyword, identifier, expression);
    }

    /**
     * Parses a command statement.
     * @returns {CommandStatement}
     */
    parseCommandStatement() {
        const orderKeyword = this.eatToken(SyntaxKind.commandKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const argumentList = this.parseArguments();

        // Eat the semicolon token (;) at the end of the statement.
        this.eatToken(SyntaxKind.semicolonToken);

        // Return an AST SyntaxNode representing a command statement.
        return new CommandStatement(orderKeyword, identifier, argumentList);
    }

    /**
     * Parses an arbitrary kind of statements according to what is the current token's kind.
     * @returns {Statement}
     */
    parseStatement() {
        switch (this.token.kind) {
            case SyntaxKind.letKeyword:
                return this.parseVarDeclStatement();

            case SyntaxKind.commandKeyword:
                return this.parseCommandStatement();

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

        this.eatToken(SyntaxKind.openBraceToken);
        while (true) {
            // Exit the 'while' loop because this is the end of this block.
            if (this.token.kind === SyntaxKind.closeBraceToken) {
                break;
            }

            // Parse the nested block in a recursive way.
            if (this.token.kind === SyntaxKind.openBraceToken) {
                elements.push(this.parseBlock());
                continue;
            }

            // This means that this block has not been terminated and
            // we run out of the tokens.
            if (this.token.kind === SyntaxKind.endOfFileToken) {
                throw new SyntaxError("Unterminated block.");
            }

            // Parse as statement.
            elements.push(this.parseStatement());
        }
        this.eatToken(SyntaxKind.closeBraceToken);

        // Return an AST SyntaxNode that represents a block with its elements (children). 
        return new BlockSyntax(elements);
    }

    /**
     * Parses the whole program.
     * @returns {ProgramSyntax}
     */
    parseProgram() {
        this.skipWhiteSpace();

        const programKeyword = this.eatToken(SyntaxKind.programKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const block = this.parseBlock();

        // Eat the End-Of-File (EOF) token.
        this.eatToken(SyntaxKind.endOfFileToken);

        return new ProgramSyntax(programKeyword, identifier, block);
    }

    /** Skips all of the white-space tokens until it runs out. */
    skipWhiteSpace() {
        while ((this.token.kind === SyntaxKind.whiteSpaceTrivia
            || this.token.kind === SyntaxKind.endOfLineToken)
            && this.token.kind !== SyntaxKind.endOfFileToken) {
            this.token = this.lexer.next();
        }
    }

    /** Moves the cursor to the next token within the source text. */
    nextToken() {
        this.token = this.lexer.next();
        this.skipWhiteSpace();
    }

    /**
     * Eats the expected token and moves to the next token.
     * @param {SyntaxKind} syntaxKind
     * @returns {SyntaxToken}
     */
    eatToken(syntaxKind) {
        if (this.token.kind !== syntaxKind) {
            throw new SyntaxError(
                `${SyntaxKind[syntaxKind]} expected instead of the token '${this.token.kindText}'.`);
        }
        const token = this.token;
        this.nextToken();
        return token;
    }
}