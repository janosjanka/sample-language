// Sample Programming Language
// Copyright (c) János Janka - All rights reserved.

"use strict";

/** Represents kind of a syntax element in the language. */
const SyntaxKind = {
    Unknown: 0,            // unknown
    EndOfFileToken: 1,     // EOF
    EndOfLineToken: 2,     // EOL
    WhiteSpaceTrivia: 3,   // white-spaces

    /* Punctuation */
    OpenBraceToken: 100,    // {
    CloseBraceToken: 101,   // }
    OpenParenToken: 102,    // (
    CloseParenToken: 103,   // (
    EqualsToken: 104,       // =
    SemicolonToken: 105,    // ;
    PlusToken: 106,         // +
    MinusToken: 107,        // -
    AsteriskToken: 108,     // *
    SlashToken: 109,        // /
    VerticalBar: 110,       // |

    /* Reserved Words */
    ProgramKeyword: 200,    // program
    CallKeyword: 201,       // call
    LetKeyword: 202,        // let
    AndKeyword: 203,        // and

    /* Identifiers */
    IdentifierToken: 300,
    NumericLiteralToken: 301,
    StringLiteralToken: 302,

    /* Names & Type Names */
    IdentifierName: 1100,

    /* Expressions */
    ParenthesizedExpression: 1200,
    ArgumentList: 1201,

    /* Primary Expressions */
    NumericLiteralExpression: 1301,
    StringLiteralExpression: 1302,

    /* Unary Expressions */
    UnaryPlusExpression: 1400,
    UnaryMinusExpression: 1401,

    /* Binary Expressions */
    AddExpression: 1500,
    SubtractExpression: 1501,
    MultiplyExpression: 1502,
    DivideExpression: 1503,

    /* Statements */
    Program: 2000,
    Block: 2001,
    VarDeclStatement: 2002,
    InvocationExpression: 2003
};

const KeywordSyntaxKindMap = {
    "program": SyntaxKind.ProgramKeyword,
    "call": SyntaxKind.CallKeyword,
    "let": SyntaxKind.LetKeyword,
    "and": SyntaxKind.AndKeyword
};

// Do not use "const name" because IE's Chakra engine
// does not allow const binding of the variable for the time being. 
for (let name in SyntaxKind) {
    SyntaxKind[SyntaxKind[name]] = name;
}

/** Thrown when an error has occured during parsing. */
class SyntaxError {
    constructor(message) {
        this.message = message;
    }
    toString() {
        return "Syntax Error: " + this.message;
    }
}

/** Thrown when an error has occured during emitting. */
class EmitterError {
    constructor(message) {
        this.message = message;
    }
    toString() {
        return "Emitter Error: " + this.message;
    }
}

class SyntaxItem {
    /**
     * @param {SyntaxKind} kind
     * @param {SyntaxItem} parent
     */
    constructor(kind, parent) {
        this.kind = kind;
        this.parent = parent;
    }

    /**
     * Gets a value indicating whether this token is a keyword.
     * @returns {Boolean}
     */
    get isKeyword() {
        return this.kind >= 200 && this.kind < 300;
    }

    /**
     * Returns true if this is a token.
     * @returns {Boolean}
     */
    get isToken() {
        return this.kind < 1000;
    }

    /**
     * Gets the text representation of the kind.
     * @returns {string}
     */
    get kindText() {
        return SyntaxKind[this.kind] || "unknown";
    }

    /**
     * Checks whether kind of the parent is the specified one.
     * @param   {SyntaxKind} kind
     * @returns {boolean}
     */
    isParentKind(kind) {
        return this.parent && this.parent.kind === kind;
    }

    /**
     * The accept method calls a visit method of the syntax visitor;
     * the element passes itself as an argument to the visit method.
     * More details: https://en.wikipedia.org/wiki/Visitor_pattern
     * @param {SyntaxVisitor} visitor An implementation of the SyntaxVisitor class.
     */
    accept(visitor) {
        visitor.visit(this);
    }
}

/**
 * An array of syntax nodes that will be maintened according to
 * where a node is inserted or deleted from the tree.
 * The parent property of all the inserted and deleted nodes
 * is automatically managed by this type.
 */
class SyntaxArray extends Array {
    /** @param {SyntaxNode} node The owner of this node collection. */
    constructor(node) {
        super();
        this.node = node;
    }

    /**
     * Appends new elements to an array, and returns the new length of the array.
     * @param items New elements of the Array.
     */
    push(...items) {
        items.forEach(node => node.parent = this.node);
        return super.push(...items);
    }
}

/**
 * Represents a lexical element that is described by its SyntaxKind.
 * Syntax tokens are the terminals of the language grammar,
 * representing the smallest syntactic fragments of the code.
 * They are never parents of other nodes or tokens.
 * Syntax tokens consist of keywords, identifiers, literals, and punctuation.
 */
class SyntaxToken extends SyntaxItem {
    /**
     * Creates a syntax token.
     * @param  {number}     kind      The kind of the node.
     * @param  {SyntaxNode} [parent]  The parent node in the tree. 
     */
    constructor(kind, parent) {
        super(kind, parent);
        this.text = "";
        this.value = void 0;
    }
}

/**
 * Syntax nodes represent nodes in the AST (Abstract Syntax Tree).
 * All syntax nodes are non-terminal nodes in the syntax tree,
 * which means they always have other nodes and tokens as children.
 * As a child of another node, each node has a parent node
 * that can be accessed through the parent property.
 * The root of the tree has an undefined parent.
 */
class SyntaxNode extends SyntaxItem {
    /**
     * Creates a syntax node.
     * @param  {number}     kind      The kind of the node.
     * @param  {SyntaxNode} [parent]  The parent node in the tree. 
     */
    constructor(kind, parent) {
        super(kind, parent);
        this.children = new SyntaxArray(this);
    }

    /**
     * The accept method calls a visit method of the syntax visitor;
     * the element passes itself as an argument to the visit method.
     * More details: https://en.wikipedia.org/wiki/Visitor_pattern
     * @param {SyntaxVisitor} visitor An implementation of the SyntaxVisitor class.
     */
    accept(visitor) {
        visitor.visit(this);
        this.children.forEach(node => node.accept(visitor));
    }
}

/**
 * Statements are the meat and bone of your application – they are the actual code
 * that executes and determines application flow and logic.
 */
class Statement extends SyntaxNode { }

/**
 * Expressions are a special sub-type of statement that represent a value.
 * As a result, expressions can usually be used in the same way a regular statement is,
 * but they can also be used in many other places where a value is expected.
 */
class Expression extends SyntaxNode { }

/**
 * Represents a parenthesized expression.
 * @example -(5 + (10 - 20))
 */
class ParenthesizedExpression extends Expression {
    constructor(openParenToken, expression, closeParenToken, parent) {
        super(SyntaxKind.ParenthesizedExpression, parent);
        this.children.push(openParenToken, expression, closeParenToken);
    }
    get openParenToken() { return this.children[0]; }
    get expression() { return this.children[1]; }
    get closeParenToken() { return this.children[2]; }
}

/**
 * An identifier is a name that identifies (that is, labels the identity of)
 * either a unique object or a unique class of objects.
 */
class IdentifierNameSyntax extends Expression {
    constructor(token, parent) {
        super(SyntaxKind.IdentifierName, parent);
        this.children.push(token);
    }
    get token() { return this.children[0]; }
}

/** Represents a list of function arguments. */
class ArgumentListSyntax extends Expression {
    constructor(argumentList, parent) {
        super(SyntaxKind.ArgumentList, parent);
        this.children.push(...argumentList);
    }
}

/**
 * A literal is a notation for representing a fixed value in source code,
 * a sequence of characters that usually carry type information about itself.
 * @example
 *    - 012345 is a numeric literal
 *    - "text" is a string literal
 *    - 'c'    is a character literal
 */
class LiteralExpressionSyntax extends Expression {
    constructor(kind, token, parent) {
        super(kind, parent);
        this.children.push(token);
    }
    get token() { return this.children[0]; }
}

/**
 * In mathematics, a unary operation is an operation with only one operand.
 * @example
 *    - positive and negative unary operator:
 *         +30 (The result of the unary plus operator (+) is the value of its operand)
 *         -10 (The unary negation operator (–) produces the negative of its operand)
 */
class UnaryExpression extends Expression {
    constructor(kind, operand, operator, parent) {
        super(kind, parent);
        this.children.push(operand, operator);
    }
    get operand() { return this.children[0]; }
    get operator() { return this.children[1]; }
}

/**
* Represents an expression that has a binary operator.
* @example
*    - 10 + 20 is a binary expression that has both left and right hand-side operands,
*      and a binary operator '+'. 
*/
class BinaryExpression extends Expression {
    constructor(kind, left, operator, right, parent) {
        super(kind, parent);
        this.children.push(left, operator, right);
    }
    get left() { return this.children[0]; }
    get operator() { return this.children[1]; }
    get right() { return this.children[2]; }
}

class ProgramSyntax extends Statement {
    constructor(adriennKeyword, identifier, block) {
        super(SyntaxKind.Program);
        this.children.push(adriennKeyword, identifier, block);
    }
    get keyword() { return this.children[0]; }
    get identifier() { return this.children[1]; }
    get block() { return this.children[2]; }
}

class BlockSyntax extends Statement {
    constructor(elements) {
        super(SyntaxKind.Block);
        this.children.push(...elements);
    }
}

class VarDeclStatement extends Statement {
    constructor(keyword, identifier, expression) {
        super(SyntaxKind.VarDeclStatement, parent);
        this.children.push(keyword, identifier);
        expression && this.children.push(expression);
    }
    get keyword() { return this.children[0]; }
    get identifier() { return this.children[1]; }
    get expression() { return this.children[2]; }
}

class InvocationExpression extends Expression {
    constructor(keyword, identifier, argumentList, parent) {
        super(SyntaxKind.InvocationExpression, parent);
        this.children.push(keyword, identifier, argumentList);
    }
    get keyword() { return this.children[0]; }
    get identifier() { return this.children[1]; }
    get arguments() { return this.children[2]; }
}