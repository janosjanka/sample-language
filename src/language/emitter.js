// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

/// <reference path="utils.js" />
/// <reference path="types.js" />

"use strict";

class Emitter {
    /**
     * Translates the given SyntaxNode with its children (the whole tree)
     * to JavaScript source text.
     * @returns {string}
     */
    emit(node) {
        return this.emitProgram(node);
    }

    /**
     * Emits JavaScript source text for the specified expression.
     * @param   {Expression} expression
     * @returns {string}
     */
    emitExpression(expression) {
        switch (expression.kind) {
            case SyntaxKind.InvocationExpression:
                return this.emitInvocationExpression(expression);

            case SyntaxKind.NumericLiteralExpression:
            case SyntaxKind.StringLiteralExpression:
            case SyntaxKind.IdentifierName:
                // Since both literals and identifiers are compatible with ECMA 6 (JavaScript) standards,
                // we can directly pass these Sample tokens to the translated source text without extra work :-)
                return expression.token.text;

            case SyntaxKind.ParenthesizedExpression:
                return `${expression.openParenToken.text}${this.emitExpression(expression.expression)}${expression.closeParenToken.text}`;

            case SyntaxKind.UnaryPlusExpression:
            case SyntaxKind.UnaryMinusExpression:
                return `${expression.operator.text}${this.emitExpression(expression.operand)}`;

            // Binary expressions
            case SyntaxKind.AddExpression:
            case SyntaxKind.SubtractExpression:
            case SyntaxKind.MultiplyExpression:
            case SyntaxKind.DivideExpression:
                return `${this.emitExpression(expression.left)}${expression.operator.text}${this.emitExpression(expression.right)}`;

            default:
                // Ooops! Something is wrong. This expression is unknown for the emmiter.
                throw new EmitterError(`The expression '${expression.kindText}' is not supported.`);
        }
    }

    /**
     * Emits JavaScript source text for the specified argument list.
     * @param   {ArgumentListSyntax} args
     * @returns {string}
     */
    emitArguments(args) {
        return args.children.map(arg => this.emitExpression(arg)).join(", ");
    }

    /**
     * Emits JavaScript source text for the specified memorize statement.
     * @param   {VarDeclStatement} statement
     * @returns {string}
     */
    emitVarDeclStatement(statement) {
        let text = "let ";
        text += statement.identifier.token.value;
        if (statement.expression) {
            text += " = ";
            text += this.emitExpression(statement.expression);
        }
        text += ";";
        return text;
    }

    /**
     * Emits JavaScript source text for the specified invocation expression.
     * @param   {InvocationExpression} expression
     * @returns {string}
     */
    emitInvocationExpression(expression) {
        let text = expression.identifier.token.value;
        text += "(";
        text += this.emitArguments(expression.arguments);
        text += ")";
        if (expression.isParentKind(SyntaxKind.Block)) {
            text += ";";
        }
        return text;
    }

    /**
     * Emits JavaScript source text for the specified statement.
     * @param   {SyntaxNode} statement
     * @returns {string}
     */
    emitStatement(statement) {
        switch (statement.kind) {
            case SyntaxKind.VarDeclStatement:
                return this.emitVarDeclStatement(statement);
            case SyntaxKind.InvocationExpression:
                return this.emitInvocationExpression(statement);
            default:
                throw new EmitterError(`The statement '${statement.kindText}' is not supported.`);
        }
    }

    /**
     * Emits JavaScript source text for the specified block.
     * @param   {BlockSyntax} block
     * @returns {string}
     */
    emitBlock(block) {
        let text = "{";
        block.children.forEach(node => {
            if (node.kind === SyntaxKind.Block) {
                text += this.emitBlock(node);
            }
            else {
                text += "\n\t";
                text += this.emitStatement(node);
            }
        });
        text += "\n}";
        return text;
    }

    /**
     * Emits JavaScript source text for the specified program.
     * @param   {ProgramSyntax} program
     * @returns {string}
     */
    emitProgram(program) {
        return `(function ${program.identifier.token.value}() ${this.emitBlock(program.block)})();`
    }
}