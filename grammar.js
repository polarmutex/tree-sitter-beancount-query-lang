module.exports = grammar({
  name: "bql",

  extras: ($) => [/\s/],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($.select_statement, $._literal),

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
