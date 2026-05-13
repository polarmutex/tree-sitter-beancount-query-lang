module.exports = grammar({
  name: "bql",

  word: ($) => $.identifier,

  extras: ($) => [/\s/],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($.select_statement, $._expression),

    _expression: ($) => choice(
      $.or_expression,
      $.and_expression,
      $.binary_expression,
      $.unary_expression,
      $.regex_expression,
      $.in_expression,
      $.parenthesized_expression,
      $.function_call,
      $.identifier,
      $._literal,
    ),

    binary_expression: ($) => prec.left(4, seq(
      field("left", $._expression),
      choice("=", "!=", "<", "<=", ">", ">="),
      field("right", $._expression),
    )),

    regex_expression: ($) => prec.left(4, seq(
      field("left", $._expression),
      "~",
      field("right", $.string),
    )),

    or_expression: ($) => prec.left(1, seq(
      field("left", $._expression),
      "OR",
      field("right", $._expression),
    )),

    and_expression: ($) => prec.left(2, seq(
      field("left", $._expression),
      "AND",
      field("right", $._expression),
    )),

    unary_expression: ($) => prec.right(3, seq("NOT", field("operand", $._expression))),

    function_call: ($) => prec(1, seq(
      field("name", $.identifier),
      "(",
      optional(seq(
        field("arguments", $._expression),
        repeat(seq(",", field("arguments", $._expression))),
      )),
      ")",
    )),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    in_expression: ($) => prec.left(4, seq(
      field("left", $._expression),
      "IN",
      "(",
      $._literal,
      repeat(seq(",", $._literal)),
      ")",
    )),

    _literal: ($) => choice($.string, $.date, $.decimal, $.integer, $.boolean, $.null),

    string: (_) => /\"[^\"]*\"/,

    date: (_) => /\d{4}-\d{2}-\d{2}/,

    decimal: (_) => /\d+\.\d+/,

    integer: (_) => /\d+/,

    boolean: (_) => choice("TRUE", "FALSE"),

    null: (_) => "NULL",

    select_statement: ($) =>
      seq(
        $.keyword_select,
        $._select_list,
      ),

    _select_list: ($) => choice($.asterisk, seq($.column_name, repeat(seq(",", $.column_name)))),

    asterisk: (_) => "*",

    column_name: ($) => $.identifier,

    keyword_select: (_) => /[Ss][Ee][Ll][Ee][Cc][Tt]/,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
