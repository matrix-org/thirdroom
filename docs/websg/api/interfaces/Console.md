[websg-types](../README.md) / [Exports](../modules.md) / Console

# Interface: Console

Console interface provides a way to log information to the browser's console.

## Table of contents

### Properties

- [Console](Console.md#console)

### Methods

- [assert](Console.md#assert)
- [clear](Console.md#clear)
- [count](Console.md#count)
- [countReset](Console.md#countreset)
- [debug](Console.md#debug)
- [dir](Console.md#dir)
- [dirxml](Console.md#dirxml)
- [error](Console.md#error)
- [group](Console.md#group)
- [groupCollapsed](Console.md#groupcollapsed)
- [groupEnd](Console.md#groupend)
- [info](Console.md#info)
- [log](Console.md#log)
- [profile](Console.md#profile)
- [profileEnd](Console.md#profileend)
- [table](Console.md#table)
- [time](Console.md#time)
- [timeEnd](Console.md#timeend)
- [timeLog](Console.md#timelog)
- [timeStamp](Console.md#timestamp)
- [trace](Console.md#trace)
- [warn](Console.md#warn)

## Properties

### Console

• **Console**: `ConsoleConstructor`

#### Defined in

node_modules/@types/node/console.d.ts:67

## Methods

### assert

▸ **assert**(`condition?`, `...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `condition?` | `boolean` |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17318

▸ **assert**(`value`, `message?`, `...optionalParams`): `void`

`console.assert()` writes a message if `value` is [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) or omitted. It only
writes a message and does not otherwise affect execution. The output always
starts with `"Assertion failed"`. If provided, `message` is formatted using `util.format()`.

If `value` is [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), nothing happens.

```js
console.assert(true, 'does nothing');

console.assert(false, 'Whoops %s work', 'didn\'t');
// Assertion failed: Whoops didn't work

console.assert();
// Assertion failed
```

**`Since`**

v0.1.101

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `any` | The value tested for being truthy. |
| `message?` | `string` | All arguments besides `value` are used as error message. |
| `...optionalParams` | `any`[] | - |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:88

___

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17319

▸ **clear**(): `void`

When `stdout` is a TTY, calling `console.clear()` will attempt to clear the
TTY. When `stdout` is not a TTY, this method does nothing.

The specific operation of `console.clear()` can vary across operating systems
and terminal types. For most Linux operating systems, `console.clear()`operates similarly to the `clear` shell command. On Windows, `console.clear()`will clear only the output in the
current terminal viewport for the Node.js
binary.

**`Since`**

v8.3.0

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:99

___

### count

▸ **count**(`label?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17320

▸ **count**(`label?`): `void`

Maintains an internal counter specific to `label` and outputs to `stdout` the
number of times `console.count()` has been called with the given `label`.

```js
> console.count()
default: 1
undefined
> console.count('default')
default: 2
undefined
> console.count('abc')
abc: 1
undefined
> console.count('xyz')
xyz: 1
undefined
> console.count('abc')
abc: 2
undefined
> console.count()
default: 3
undefined
>
```

**`Since`**

v8.3.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `label?` | `string` | The display label for the counter. |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:128

___

### countReset

▸ **countReset**(`label?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17321

▸ **countReset**(`label?`): `void`

Resets the internal counter specific to `label`.

```js
> console.count('abc');
abc: 1
undefined
> console.countReset('abc');
undefined
> console.count('abc');
abc: 1
undefined
>
```

**`Since`**

v8.3.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `label?` | `string` | The display label for the counter. |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:146

___

### debug

▸ **debug**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17322

▸ **debug**(`message?`, `...optionalParams`): `void`

The `console.debug()` function is an alias for [log](Console.md#log).

**`Since`**

v8.0.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:151

___

### dir

▸ **dir**(`item?`, `options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `item?` | `any` |
| `options?` | `any` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17323

▸ **dir**(`obj`, `options?`): `void`

Uses `util.inspect()` on `obj` and prints the resulting string to `stdout`.
This function bypasses any custom `inspect()` function defined on `obj`.

**`Since`**

v0.1.101

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |
| `options?` | `InspectOptions` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:157

___

### dirxml

▸ **dirxml**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17324

▸ **dirxml**(`...data`): `void`

This method calls `console.log()` passing it the arguments received.
This method does not produce any XML formatting.

**`Since`**

v8.0.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:163

___

### error

▸ **error**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17325

▸ **error**(`message?`, `...optionalParams`): `void`

Prints to `stderr` with newline. Multiple arguments can be passed, with the
first used as the primary message and all additional used as substitution
values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

If formatting elements (e.g. `%d`) are not found in the first string then `util.inspect()` is called on each argument and the resulting string
values are concatenated. See `util.format()` for more information.

**`Since`**

v0.1.100

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:181

___

### group

▸ **group**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17326

▸ **group**(`...label`): `void`

Increases indentation of subsequent lines by spaces for `groupIndentation`length.

If one or more `label`s are provided, those are printed first without the
additional indentation.

**`Since`**

v8.5.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `...label` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:189

___

### groupCollapsed

▸ **groupCollapsed**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17327

▸ **groupCollapsed**(`...label`): `void`

An alias for [group](Console.md#group).

**`Since`**

v8.5.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `...label` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:194

___

### groupEnd

▸ **groupEnd**(): `void`

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17328

▸ **groupEnd**(): `void`

Decreases indentation of subsequent lines by spaces for `groupIndentation`length.

**`Since`**

v8.5.0

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:199

___

### info

▸ **info**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17329

▸ **info**(`message?`, `...optionalParams`): `void`

The `console.info()` function is an alias for [log](Console.md#log).

**`Since`**

v0.1.100

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:204

___

### log

▸ **log**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17330

▸ **log**(`...data`): `void`

Logs the provided data to the browser's console.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...data` | `any`[] | The data to be logged. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:2215](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2215)

▸ **log**(`message?`, `...optionalParams`): `void`

Prints to `stdout` with newline. Multiple arguments can be passed, with the
first used as the primary message and all additional used as substitution
values similar to [`printf(3)`](http://man7.org/linux/man-pages/man3/printf.3.html) (the arguments are all passed to `util.format()`).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

See `util.format()` for more information.

**`Since`**

v0.1.100

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:221

___

### profile

▸ **profile**(`label?`): `void`

This method does not display anything unless used in the inspector.
 Starts a JavaScript CPU profile with an optional label.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:321

___

### profileEnd

▸ **profileEnd**(`label?`): `void`

This method does not display anything unless used in the inspector.
 Stops the current JavaScript CPU profiling session if one has been started and prints the report to the Profiles panel of the inspector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:326

___

### table

▸ **table**(`tabularData?`, `properties?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tabularData?` | `any` |
| `properties?` | `string`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17331

▸ **table**(`tabularData`, `properties?`): `void`

Try to construct a table with the columns of the properties of `tabularData`(or use `properties`) and rows of `tabularData` and log it. Falls back to just
logging the argument if it can’t be parsed as tabular.

```js
// These can't be parsed as tabular data
console.table(Symbol());
// Symbol()

console.table(undefined);
// undefined

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
// ┌─────────┬─────┬─────┐
// │ (index) │  a  │  b  │
// ├─────────┼─────┼─────┤
// │    0    │  1  │ 'Y' │
// │    1    │ 'Z' │  2  │
// └─────────┴─────┴─────┘

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }], ['a']);
// ┌─────────┬─────┐
// │ (index) │  a  │
// ├─────────┼─────┤
// │    0    │  1  │
// │    1    │ 'Z' │
// └─────────┴─────┘
```

**`Since`**

v10.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tabularData` | `any` | - |
| `properties?` | readonly `string`[] | Alternate properties for constructing the table. |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:253

___

### time

▸ **time**(`label?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17332

▸ **time**(`label?`): `void`

Starts a timer that can be used to compute the duration of an operation. Timers
are identified by a unique `label`. Use the same `label` when calling [timeEnd](Console.md#timeend) to stop the timer and output the elapsed time in
suitable time units to `stdout`. For example, if the elapsed
time is 3869ms, `console.timeEnd()` displays "3.869s".

**`Since`**

v0.1.104

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:261

___

### timeEnd

▸ **timeEnd**(`label?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17333

▸ **timeEnd**(`label?`): `void`

Stops a timer that was previously started by calling [time](Console.md#time) and
prints the result to `stdout`:

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

**`Since`**

v0.1.104

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:274

___

### timeLog

▸ **timeLog**(`label?`, `...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17334

▸ **timeLog**(`label?`, `...data`): `void`

For a timer that was previously started by calling [time](Console.md#time), prints
the elapsed time and other `data` arguments to `stdout`:

```js
console.time('process');
const value = expensiveProcess1(); // Returns 42
console.timeLog('process', value);
// Prints "process: 365.227ms 42".
doExpensiveProcess2(value);
console.timeEnd('process');
```

**`Since`**

v10.7.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:289

___

### timeStamp

▸ **timeStamp**(`label?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17335

▸ **timeStamp**(`label?`): `void`

This method does not display anything unless used in the inspector.
 Adds an event with the label `label` to the Timeline panel of the inspector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `label?` | `string` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:331

___

### trace

▸ **trace**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17336

▸ **trace**(`message?`, `...optionalParams`): `void`

Prints to `stderr` the string `'Trace: '`, followed by the `util.format()` formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Prints: (stack trace will vary based on where trace is called)
//  Trace: Show me
//    at repl:2:9
//    at REPLServer.defaultEval (repl.js:248:27)
//    at bound (domain.js:287:14)
//    at REPLServer.runBound [as eval] (domain.js:300:12)
//    at REPLServer.<anonymous> (repl.js:412:12)
//    at emitOne (events.js:82:20)
//    at REPLServer.emit (events.js:169:7)
//    at REPLServer.Interface._onLine (readline.js:210:10)
//    at REPLServer.Interface._line (readline.js:549:8)
//    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```

**`Since`**

v0.1.104

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:310

___

### warn

▸ **warn**(`...data`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...data` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/typescript/lib/lib.dom.d.ts:17337

▸ **warn**(`message?`, `...optionalParams`): `void`

The `console.warn()` function is an alias for [error](Console.md#error).

**`Since`**

v0.1.100

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `any` |
| `...optionalParams` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/console.d.ts:315
