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
        optional(field("distinct", $.keyword_distinct)),
        field("targets", $.select_targets),
        optional(field("from", $.from_clause)),
        optional(field("where", $.where_clause)),
        optional($.semicolon),
      ),

    from_clause: ($) =>
      seq(
        $.keyword_from,
        choice(
          seq(
            field("filter", $._expression),
            repeat(field("operators", $._statement_operator)),
          ),
          repeat1(field("operators", $._statement_operator)),
        ),
      ),

    _statement_operator: ($) => choice(
      $.open_clause,
      $.close_clause,
      $.clear_clause,
    ),

    open_clause: ($) => seq(
      $.keyword_open,
      $.keyword_on,
      field("date", $.date),
    ),

    close_clause: ($) => seq(
      $.keyword_close,
      optional(seq($.keyword_on, field("date", $.date))),
    ),

    clear_clause: ($) => $.keyword_clear,

    select_targets: ($) =>
      seq(
        $.select_target,
        repeat(seq(",", $.select_target)),
      ),

    select_target: ($) => choice($.asterisk, $.function_call, $.identifier),

    asterisk: (_) => "*",

    keyword_select: (_) => /[Ss][Ee][Ll][Ee][Cc][Tt]/,

    keyword_distinct: (_) => /[Dd][Ii][Ss][Tt][Ii][Nn][Cc][Tt]/,

    keyword_where: (_) => /[Ww][Hh][Ee][Rr][Ee]/,

    keyword_from: (_) => token(prec(1, /[Ff][Rr][Oo][Mm]/)),

    keyword_open: (_) => token(prec(1, /[Oo][Pp][Ee][Nn]/)),

    keyword_close: (_) => token(prec(1, /[Cc][Ll][Oo][Ss][Ee]/)),

    keyword_clear: (_) => token(prec(1, /[Cc][Ll][Ee][Aa][Rr]/)),

    keyword_on: (_) => token(prec(1, /[Oo][Nn]/)),

    semicolon: (_) => ";",

    where_clause: ($) => seq($.keyword_where, $._expression),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
