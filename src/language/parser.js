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
            // 1. Parse the current argument and add the result to the array.
            // 2. Is there another argument?
            // 3. Check whether this is the end of the argument list (;).
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

        // Return an AST SyntaxNode representing an argument list
        // with its arguments.
        return new ArgumentListSyntax(argumentList);
    }

    /**
     * Parses a single memorize statement eating all the lexical elements
     * related to this rule/notion.
     */
    parseVarDeclStatement() {
        // 1. Eat the keyword "memorizál".
        // 2. Eat the identifier that represents the name of a constant
        //    and convert that to an AST SyntaxNode (IdentifierSyntax).
        // 3. Parse the expression that will be the value of this constant.
        const memorizeKeyword = this.eatToken(SyntaxKind.letKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const expression = this.parseExpression();

        // 4. Eat the semicolon (;) token at the end of the statement.
        this.eatToken(SyntaxKind.semicolonToken);

        // 5. Return an AST SyntaxNode representing a memorize statement
        //    with its grammar elements ("memorizál", identifier, expression).   
        return new VarDeclStatement(memorizeKeyword, identifier, expression);
    }

    /**
     * Parses a single order statement eating all the lexical elements
     * related to this rule/notion.
     */
    parseCommandStatement() {
        // 1. Eat the keyword "utasít". Each order statement must start with this keyword.
        // 2. Eat the identifier that represents the name of a function
        //    and convert that to an AST SyntaxNode (IdentifierSyntax). 
        // 3. Parse all the function arguments to AST SyntaxNode.
        const orderKeyword = this.eatToken(SyntaxKind.commandKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const argumentList = this.parseArguments();

        // 4. Eat the semicolon token (;) at the end of the statement.
        this.eatToken(SyntaxKind.semicolonToken);

        // 5. Return an AST SyntaxNode representing an order statement
        //    order statement with its grammar elements ("utasít", identifier, argumentList).   
        return new CommandStatement(orderKeyword, identifier, argumentList);
    }

    /**
     * Parses an arbitrary kind of statements according to what is
     * the current token's kind.
     * @returns {Statement}
     */
    parseStatement() {
        switch (this.token.kind) {
            // In this case, this will be a memorize statement so we call the parseMemorizeStatement().
            case SyntaxKind.letKeyword:
                return this.parseVarDeclStatement();

            // In this case, this will be an order statement so we call the parseOrderStatement().
            case SyntaxKind.commandKeyword:
                return this.parseCommandStatement();

            default:
                // Something is wrong. The user forgot to write at least command :-)
                throw new SyntaxError(`A statement expected instead of the token '${this.token.kindText}'.`);
        }
    }

    /**
     * Parses a block element { }. Since a block element can be nested into another block
     * element, we call this function in a recursive way too.
     * @returns {BlockSyntax} 
     */
    parseBlock() {
        const elements = [];

        // 1. Eat the open brace token "{" and skip all white-space characters after it.
        // 2. Parse all the statements between the curly braces { }.
        // 3. Eat the close brace token "}" ignoring leading white-space characters.
        this.eatToken(SyntaxKind.openBraceToken);
        while (true) {
            // 2.1. Exit the 'while' loop because this is the end of this block.
            // 2.2. Parse the nested block in a recursive way.
            // 2.3. This is a problem. This means this block has not been terminated.            
            // 2.4. Parse the statement and add the result to the array 'elements'.
            if (this.token.kind === SyntaxKind.closeBraceToken) break;
            if (this.token.kind === SyntaxKind.openBraceToken) {
                elements.push(this.parseBlock());
                continue;
            }
            if (this.token.kind === SyntaxKind.endOfFileToken) throw new SyntaxError("Unterminated block.");
            elements.push(this.parseStatement());
        }
        this.eatToken(SyntaxKind.closeBraceToken);

        // Return an AST SyntaxNode that represents a block with its elements (children). 
        return new BlockSyntax(elements);
    }

    /**
     * Parses the whole program.
     */
    parseProgram() {
        this.skipWhiteSpace();

        // 1. Eat the keyword "program" with both lead and trail trivia (white-spaces)
        // 2. Eat the identifier after the keyword "program".
        // 3. Eat the block element.
        const programKeyword = this.eatToken(SyntaxKind.programKeyword);
        const identifier = new IdentifierNameSyntax(this.eatToken(SyntaxKind.identifierToken));
        const block = this.parseBlock();

        // 4. Eat the End-Of-File (EOF) token.
        this.eatToken(SyntaxKind.endOfFileToken);

        return new ProgramSyntax(programKeyword, identifier, block);
    }

    /**
     * Skips all of the white-space tokens until it runs out.
     */
    skipWhiteSpace() {
        while ((this.token.kind === SyntaxKind.whiteSpaceTrivia
            || this.token.kind === SyntaxKind.endOfLineToken)
            && this.token.kind !== SyntaxKind.endOfFileToken) {
            this.token = this.lexer.next();
        }
    }

    /**
     * Moves the cursor to the next token within the source text.
     */
    nextToken() {
        this.token = this.lexer.next();
        this.skipWhiteSpace();
    }

    /**
     * Eats the expected token and moves to the next token.
     * @param  {SyntaxKind} syntaxKind
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