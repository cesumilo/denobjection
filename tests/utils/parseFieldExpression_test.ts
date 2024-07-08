import { assertEquals } from 'https://deno.land/std@0.224.0/assert/assert_equals.ts';
import {
  ParsedExpression,
  parseFieldExpression,
  SyntaxError,
} from '../../src/utils/parseFieldExpression.ts';
import { assertInstanceOf } from 'https://deno.land/std@0.224.0/assert/assert_instance_of.ts';

Deno.test('parseFieldExpression', async (t) => {
  // basic index and field references
  await t.step('col:[1] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'array',
        ref: 1,
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:[1]'), expected);
  });

  await t.step("col:['1'] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '1',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:['1']"), expected);
  });

  await t.step('col:[a] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'a',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:[a]'), expected);
  });

  await t.step("col:['a'] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'a',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:['a']"), expected);
  });

  await t.step('col:["a"] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'a',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:["a"]'), expected);
  });

  await t.step('col:a should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'a',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:a'), expected);
  });

  // less basic random babbling of test cases
  await t.step('123 should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123'), expected);
  });

  await t.step('123:abc should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [{
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123:abc'), expected);
  });

  await t.step('123:[1].abc should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [{
        type: 'array',
        ref: 1,
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123:[1].abc'), expected);
  });

  await t.step('123:[1.2].abc should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [{
        type: 'object',
        ref: '1.2',
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123:[1.2].abc'), expected);
  });

  await t.step('123:[1.2][1].abc should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [{
        type: 'object',
        ref: '1.2',
      }, {
        type: 'array',
        ref: 1,
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123:[1.2][1].abc'), expected);
  });

  await t.step('schema.[myTable].column.foo should work', () => {
    const expected: ParsedExpression = {
      column: 'foo',
      columnName: 'schema.[myTable].column.foo',
      access: [],
      table: 'schema.[myTable].column',
    };
    assertEquals(parseFieldExpression('schema.[myTable].column.foo'), expected);
  });

  await t.step('schema.myTable.json:foo) should work', () => {
    const expected: ParsedExpression = {
      column: 'json',
      columnName: 'schema.myTable.json',
      access: [{
        type: 'object',
        ref: 'foo)',
      }],
      table: 'schema.myTable',
    };
    assertEquals(parseFieldExpression('schema.myTable.json:foo)'), expected);
  });

  await t.step('schema.myTable.json:0foo.bar[0].bob should work', () => {
    const expected: ParsedExpression = {
      column: 'json',
      columnName: 'schema.myTable.json',
      access: [{
        type: 'object',
        ref: '0foo',
      }, {
        type: 'object',
        ref: 'bar',
      }, {
        type: 'array',
        ref: 0,
      }, {
        type: 'object',
        ref: 'bob',
      }],
      table: 'schema.myTable',
    };
    assertEquals(
      parseFieldExpression('schema.myTable.json:0foo.bar[0].bob'),
      expected,
    );
  });

  await t.step('schema.myTable.json:0.bar[0].bob should work', () => {
    const expected: ParsedExpression = {
      column: 'json',
      columnName: 'schema.myTable.json',
      access: [{
        type: 'object',
        ref: '0',
      }, {
        type: 'object',
        ref: 'bar',
      }, {
        type: 'array',
        ref: 0,
      }, {
        type: 'object',
        ref: 'bob',
      }],
      table: 'schema.myTable',
    };
    assertEquals(
      parseFieldExpression('schema.myTable.json:0.bar[0].bob'),
      expected,
    );
  });

  await t.step('123:["1.2"][1].abc should work', () => {
    const expected: ParsedExpression = {
      column: '123',
      columnName: '123',
      access: [{
        type: 'object',
        ref: '1.2',
      }, {
        type: 'array',
        ref: 1,
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('123:["1.2"][1].abc'), expected);
  });

  // with different quotes
  await t.step("col:['[1.2]'][1].abc should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '[1.2]',
      }, {
        type: 'array',
        ref: 1,
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:['[1.2]'][1].abc"), expected);
  });

  await t.step('col:["[1.2]"][1].abc should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '[1.2]',
      }, {
        type: 'array',
        ref: 1,
      }, {
        type: 'object',
        ref: 'abc',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:["[1.2]"][1].abc'), expected);
  });

  // array reference having only quotes
  await t.step("col:['] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: "'",
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:[']"), expected);
  });

  await t.step("col:[''] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: "''",
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:['']"), expected);
  });

  await t.step("col:['''] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: "'''",
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:[''']"), expected);
  });

  await t.step('col:["] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '"',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:["]'), expected);
  });

  await t.step('col:[""] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '""',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:[""]'), expected);
  });

  await t.step('col:["""] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: '"""',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:["""]'), expected);
  });

  // array reference having quotes and brackets
  await t.step('col:field["nofa\'].il"] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'field',
      }, {
        type: 'object',
        ref: "nofa'].il",
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:field["nofa\'].il"]'), expected);
  });

  await t.step("col:field['nofa\"].il'] should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'field',
      }, {
        type: 'object',
        ref: 'nofa"].il',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:field['nofa\"].il']"), expected);
  });

  // quotes in dotreference part
  await t.step("col:I'mCool should work", () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: "I'mCool",
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression("col:I'mCool"), expected);
  });

  await t.step('col:PleaseMindThe"Quote" should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'PleaseMindThe"Quote"',
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:PleaseMindThe"Quote"'), expected);
  });

  // spaces in dotreference part
  // testParsing('col:I work too [100]', ['col', 'I work too ', 100]);
  await t.step('col:I work too [100] should work', () => {
    const expected: ParsedExpression = {
      column: 'col',
      columnName: 'col',
      access: [{
        type: 'object',
        ref: 'I work too ',
      }, {
        type: 'array',
        ref: 100,
      }],
      table: undefined,
    };
    assertEquals(parseFieldExpression('col:I work too [100]'), expected);
  });

  // new column reference style
  await t.step('MyCupOfTeaTable.cupOfTea:I work too [100] should work', () => {
    const expected: ParsedExpression = {
      column: 'cupOfTea',
      columnName: 'MyCupOfTeaTable.cupOfTea',
      access: [{
        type: 'object',
        ref: 'I work too ',
      }, {
        type: 'array',
        ref: 100,
      }],
      table: 'MyCupOfTeaTable',
    };
    assertEquals(
      parseFieldExpression('MyCupOfTeaTable.cupOfTea:I work too [100]'),
      expected,
    );
  });

  // with schema
  await t.step(
    'schema.MyCupOfTeaTable.cupOfTea:I work too [100] should work',
    () => {
      const expected: ParsedExpression = {
        column: 'cupOfTea',
        columnName: 'schema.MyCupOfTeaTable.cupOfTea',
        access: [{
          type: 'object',
          ref: 'I work too ',
        }, {
          type: 'array',
          ref: 100,
        }],
        table: 'schema.MyCupOfTeaTable',
      };
      assertEquals(
        parseFieldExpression(
          'schema.MyCupOfTeaTable.cupOfTea:I work too [100]',
        ),
        expected,
      );
    },
  );

  // no column given
  await t.step(':[] should fail', () => {
    try {
      parseFieldExpression(':[]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step(':[nocolumn] should fail', () => {
    try {
      parseFieldExpression(':[nocolumn]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step(':["nocolumn"] should fail', () => {
    try {
      parseFieldExpression(':["nocolumn"]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step(":['nocolumn'] should fail", () => {
    try {
      parseFieldExpression(":['nocolumn']");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step(':nocolumn should fail', () => {
    try {
      parseFieldExpression(':nocolumn');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // invalid dotreference
  await t.step('col:[1]. should fail', () => {
    try {
      parseFieldExpression('col:[1].');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // trying to use index operator after dot
  await t.step('col:wat.[1] should fail', () => {
    try {
      parseFieldExpression('col:wat.[1]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:wat.['1'] should fail", () => {
    try {
      parseFieldExpression("col:wat.['1']");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat.["1"] should fail', () => {
    try {
      parseFieldExpression('col:wat.["1"]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat[1].[1] should fail', () => {
    try {
      parseFieldExpression('col:wat[1].[1]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:wat[1].['1'] should fail", () => {
    try {
      parseFieldExpression("col:wat[1].['1']");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat[1].["1"] should fail', () => {
    try {
      parseFieldExpression('col:wat[1].["1"]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // opening square bracket in dot ref
  await t.step('col:a[1 should fail', () => {
    try {
      parseFieldExpression('col:a[1');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:a['1' should fail", () => {
    try {
      parseFieldExpression("col:a['1'");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:a["1" should fail', () => {
    try {
      parseFieldExpression('col:a["1"');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:a[1].a[1 should fail', () => {
    try {
      parseFieldExpression('col:a[1].a[1');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:a[1].a['1' should fail", () => {
    try {
      parseFieldExpression("col:a[1].a['1'");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:a[1].a["1" should fail', () => {
    try {
      parseFieldExpression('col:a[1].a["1"');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // closing square bracket in dot ref
  await t.step('col:a] should fail', () => {
    try {
      parseFieldExpression('col:a]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:a]'1' should fail", () => {
    try {
      parseFieldExpression("col:a]'1'");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:a]"1" should fail', () => {
    try {
      parseFieldExpression('col:a]"1"');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:[1].a]1 should fail', () => {
    try {
      parseFieldExpression('col:[1].a]1');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:[1].a]'1' should fail", () => {
    try {
      parseFieldExpression("col:[1].a]'1'");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:[1].a]"1" should fail', () => {
    try {
      parseFieldExpression('col:[1].a]"1"');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // invalid array references
  await t.step('col:wat[] should fail', () => {
    try {
      parseFieldExpression('col:wat[]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat[ should fail', () => {
    try {
      parseFieldExpression('col:wat[');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat.a[ should fail', () => {
    try {
      parseFieldExpression('col:wat.a[');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat] should fail', () => {
    try {
      parseFieldExpression('col:wat]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat.a] should fail', () => {
    try {
      parseFieldExpression('col:wat.a]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat[fa[il] should fail', () => {
    try {
      parseFieldExpression('col:wat[fa[il]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat[fa]il] should fail', () => {
    try {
      parseFieldExpression('col:wat[fa]il]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat.field[fa[il] should fail', () => {
    try {
      parseFieldExpression('col:wat.field[fa[il]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step('col:wat.field[fa]il] should fail', () => {
    try {
      parseFieldExpression('col:wat.field[fa]il]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  // these should fail because inside quotes there is same type of
  // quote => parser tries use stringWithoutSquareBrackets token
  // for parsing => bracket in key fails parsing
  await t.step('col:field["fa"]il"] should fail', () => {
    try {
      parseFieldExpression('col:field["fa"]il"]');
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });

  await t.step("col:field['fa']il'] should fail", () => {
    try {
      parseFieldExpression("col:field['fa']il']");
    } catch (err: unknown) {
      assertInstanceOf(err, SyntaxError);
    }
  });
});
