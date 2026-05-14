module.exports = grammar({
  name: "bql",

  word: ($) => $.identifier,

  extras: ($) => [/\s/],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($.select_statement, $.journal_statement, $.balances_statement, $.print_statement, $.explain_statement, $._expression),

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
        optional(field("group_by", $.group_by_clause)),
        optional(field("order_by", $.order_by_clause)),
        optional(field("limit", $.limit_clause)),
        optional($.semicolon),
      ),

    limit_clause: ($) => seq($.keyword_limit, $.integer),

    group_by_clause: ($) =>
      seq(
        $.keyword_group,
        $.keyword_by,
        $.group_by_term,
        repeat(seq(",", $.group_by_term)),
      ),

    group_by_term: ($) => choice($.integer, $.identifier),

    order_by_clause: ($) =>
      seq(
        $.keyword_order,
        $.keyword_by,
        $.order_by_term,
        repeat(seq(",", $.order_by_term)),
      ),

    order_by_term: ($) =>
      seq(
        $._expression,
        optional(field("direction", choice($.keyword_asc, $.keyword_desc))),
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

    keyword_group: (_) => token(prec(1, /[Gg][Rr][Oo][Uu][Pp]/)),

    keyword_order: (_) => token(prec(1, /[Oo][Rr][Dd][Ee][Rr]/)),

    keyword_by: (_) => token(prec(1, /[Bb][Yy]/)),

    keyword_asc: (_) => token(prec(1, /[Aa][Ss][Cc]/)),

    keyword_desc: (_) => token(prec(1, /[Dd][Ee][Ss][Cc]/)),

    keyword_limit: (_) => token(prec(1, /[Ll][Ii][Mm][Ii][Tt]/)),

    journal_statement: ($) =>
      prec.right(seq(
        $.keyword_journal,
        optional(field("account_regexp", $.string)),
        optional(seq($.keyword_at, field("at", choice($.function_call, $.identifier)))),
        optional(field("from", $.from_clause)),
        optional($.semicolon),
      )),

    balances_statement: ($) =>
      seq(
        $.keyword_balances,
        optional(seq($.keyword_at, field("at", choice($.function_call, $.identifier)))),
        optional(field("from", $.from_clause)),
        optional($.semicolon),
      ),

    print_statement: ($) =>
      seq(
        $.keyword_print,
        optional(field("from", $.from_clause)),
        optional($.semicolon),
      ),

    explain_statement: ($) =>
      seq(
        $.keyword_explain,
        field("statement", choice(
          $.select_statement,
          $.journal_statement,
          $.balances_statement,
          $.print_statement,
        )),
      ),

    keyword_explain: (_) => token(prec(1, /[Ee][Xx][Pp][Ll][Aa][Ii][Nn]/)),

    keyword_journal: (_) => token(prec(1, /[Jj][Oo][Uu][Rr][Nn][Aa][Ll]/)),

    keyword_balances: (_) => token(prec(1, /[Bb][Aa][Ll][Aa][Nn][Cc][Ee][Ss]/)),

    keyword_print: (_) => token(prec(1, /[Pp][Rr][Ii][Nn][Tt]/)),

    keyword_at: (_) => token(prec(1, /[Aa][Tt]/)),

    semicolon: (_) => ";",

    where_clause: ($) => seq($.keyword_where, $._expression),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
