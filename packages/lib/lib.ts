
    export const formulas = {
  "@toddle/decodeURIComponent": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Decode URI Component",
    "description": "Decode a URI component that was previously encoded with the Encode URI Component formula.",
    "arguments": [
      {
        "name": "EncodedURI",
        "formula": {
          "type": "value",
          "value": null
        },
        "type": {
          "type": "String"
        },
        "description": "The encoded URI to decode."
      }
    ],
    "output": {
      "description": "The decoded URI component.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/split": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Split",
    "description": "Split a String into an Array of smaller strings each time a delimiter occurs. The delimiter will not be part of the output.",
    "arguments": [
      {
        "name": "Input",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The String to split.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Delimiter",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The string to split by.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "An array of Strings.",
      "type": {
        "type": "Array",
        "ofType": {
          "type": "String"
        }
      }
    }
  },
  "@toddle/squareRoot": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Square root",
    "description": "Get the square root of a Number.",
    "arguments": [
      {
        "name": "Number",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The input Number.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The square root of the input Number.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/power": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Power",
    "description": "Raise a number to a power.",
    "arguments": [
      {
        "name": "Base",
        "formula": {
          "type": "value",
          "value": 3
        },
        "description": "The number to be raised to the exponent.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Exponent",
        "formula": {
          "type": "value",
          "value": 2
        },
        "description": "The exponent to raise the base to.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "The result of raising the base to the exponent."
    }
  },
  "@toddle/unique": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Unique",
    "description": "Remove duplicate values from an Array.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": []
        },
        "type": {
          "type": "Array"
        },
        "description": "The input Array."
      }
    ],
    "output": {
      "description": "The input Array with all duplicate values removed.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/lessOrEqual": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Less or equal",
    "description": "Compute if a value is smaller than or equal to another value.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First Number to be compared.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second Number to be compared.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "Returns True if the First Number is smaller than or equal to the second Number, otherwise it returns False.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/userAgent": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "User Agent",
    "description": "Get the user agent for the browser or from the User-Agent header on the server. See [User-Agent on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) for more information.",
    "arguments": [],
    "output": {
      "description": "The user agent string.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/deleteKey": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Delete",
    "description": "Return a copy of the input Object or Array without the specified key.",
    "arguments": [
      {
        "name": "Object",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input record.",
        "type": {
          "type": "Array \\| Object"
        }
      },
      {
        "name": "Path",
        "formula": {
          "type": "value",
          "value": "Item"
        },
        "description": "The path can be either a Number (if the first argument is an array), a String, or an Array of strings. If an Array is given, the property at that path will be removed.",
        "type": {
          "type": "Array<Number \\| String> \\| Number \\| String"
        }
      }
    ],
    "output": {
      "description": "A copy of the record without the property specified in the Path.",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/branchName": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Branch Name",
    "description": "Get the name of the current branch. For production, the branch name is 'main'.",
    "arguments": [],
    "output": {
      "description": "Returns the name of the current branch.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/shuffle": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Shuffle",
    "description": "Shuffle items in an Array or String.",
    "cache": false,
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input value.",
        "type": {
          "type": "Array \\| String"
        }
      }
    ],
    "output": {
      "description": "The shuffled Array or String.",
      "type": {
        "type": "Array \\| String"
      }
    }
  },
  "@toddle/dateFromTimestamp": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Date From Timestamp",
    "arguments": [
      {
        "name": "Timestamp",
        "description": "A Number in milliseconds since 1st January, 1970 (EPOCH).",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1687787245933
        }
      }
    ],
    "description": "Convert a timestamp (milliseconds) to a Date.",
    "output": {
      "description": "The input value converted to a Date.",
      "type": {
        "type": "Date"
      }
    }
  },
  "@toddle/parseJSON": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Parse JSON",
    "description": "Parse a String to JSON.",
    "arguments": [
      {
        "name": "JSON string",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The String to be parsed.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Date parsing",
        "formula": {
          "type": "value",
          "value": false
        },
        "description": "Whether to attempt parsing date strings to Date objects. This can have a significant impact on performance, so it is disabled by default.",
        "type": {
          "type": "Boolean"
        }
      }
    ],
    "output": {
      "description": "The parsed JSON value. If the input is not a valid String, this returns Null.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/last": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Last",
    "description": "Get the last item in an Array or the last character in a String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": []
        },
        "type": {
          "type": "Array \\| String"
        },
        "description": "An array of items or a String."
      }
    ],
    "output": {
      "description": "The last item in the Array or the last character in the String.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/defaultTo": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Default to",
    "description": "Return the first value that is not False or Null.",
    "arguments": [
      {
        "name": "0",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The inital value.",
        "type": {
          "type": "Any"
        }
      },
      {
        "name": "1",
        "description": "The first fallback value to be used if the primary value is Null or False.",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": "default"
        }
      }
    ],
    "variableArguments": true,
    "output": {
      "description": "Returns the first value that is not False or Null. Returns Null if no valid values is given.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/entries": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Entries",
    "description": "Get an Array of entries from a given Object.",
    "arguments": [
      {
        "name": "Object",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input record",
        "type": {
          "type": "Object"
        }
      }
    ],
    "output": {
      "description": "Returns an Array of entries for the given input record. The entries are Objects with a “key” and “value” property.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/every": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Every",
    "description": "Run a formula returns for all items in an Array.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The array of items to evaluate.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "Predicate formula for evaluating each item.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "Returns True if the predicate formula returns true for all items in the Array, otherwise False.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/not": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Not",
    "description": "Get the Boolean opposite of an input value.",
    "arguments": [
      {
        "name": "Input",
        "formula": {
          "type": "value",
          "value": true
        },
        "description": "The input value.",
        "type": {
          "type": "Boolean"
        }
      }
    ],
    "output": {
      "description": "Returns True if the input value is False, and False if the input value is True.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/encodeBase64": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Encode to base64",
    "arguments": [
      {
        "name": "Value",
        "formula": {
          "type": "value",
          "value": "Input value"
        },
        "type": {
          "type": "String"
        },
        "description": "The input string to be encoded."
      }
    ],
    "description": "Encode a string to base64.",
    "output": {
      "description": "The base 64 encoded string.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/join": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Join",
    "description": "Combine an Array of Strings into a single String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "An array of Strings.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Separator",
        "formula": {
          "type": "value",
          "value": ", "
        },
        "description": "A separator String that is inserted in between each item in the Array to join.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "A String combining each item in the input Array separated by the separator String, e.g. joining [\"a\", \"b\", \"c\"] with a \",\" separator will return \"a,b,c\".",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/findIndex": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Find index",
    "description": "Search through an Array of items and apply a formula to each item, to return the index of the first item where the formula returns True.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The array to search.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "The predicate formula that each item in the Array is passed to.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "The index of the first item in the Array where the predicate formula returns True. Returns -1 if the predicate formula did not return True for any item.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/minus": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Minus",
    "description": "Subtract a Number from a Number.",
    "arguments": [
      {
        "name": "Minuend",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The number to subtract from.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Substrahend",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The number to subtract.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The result of subtracting the Substrahend from the Minuend.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/greaterThan": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Greater than",
    "description": "Compute if a value is larger than another value.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First value to be compared.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second value to be compared.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "Returns True if the first Number is larger than the second Number.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/multiply": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Multiply",
    "description": "Multiply two or more Numbers.",
    "arguments": [
      {
        "name": "0",
        "formula": {
          "type": "value",
          "value": 1
        },
        "type": {
          "type": "Number"
        },
        "description": "Number to be multiplied."
      },
      {
        "name": "1",
        "formula": {
          "type": "value",
          "value": 1
        },
        "type": {
          "type": "Number"
        },
        "description": "Number to be multiplied."
      }
    ],
    "variableArguments": true,
    "output": {
      "description": "The product of multiplying the input Numbers.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/reduce": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Reduce",
    "description": "Reduce a group of items to a single value by applying each item to a reducer formula.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The Array or Object of items to be reduced.",
        "type": {
          "type": "Array \\| Object"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The reducer formula. Each item in the Array is applied to the formula along with the accumulator. The result of this formula will be a new accumulator used for the next item.",
        "type": {
          "type": "Formula"
        }
      },
      {
        "name": "Accumulator",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The initial value of the accumulator. This value is passed to the reducer formula along with the first item in the Array, and the result is used as the accumulator for the next item.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "The value returned from applying the last item to the reducer formula.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/first": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "First",
    "description": "Return the first item in an Array or the first character in a String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": []
        },
        "type": {
          "type": "Array \\| String"
        },
        "description": "An Array of items or a String."
      }
    ],
    "output": {
      "description": "The first item in the Array or the first character in the String.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/getFromLocalStorage": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get from Local Storage",
    "description": "Read a value from local storage with the provided key.\nIf the value is a JSON string it is automatically parsed before it is returned.\nYou do not need to use the parseJSON formula",
    "cache": false,
    "arguments": [
      {
        "name": "Key",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The key to read from local storage.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The value found in local storage. If no value is found, this will return Null.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/divide": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Divide",
    "description": "Perform a division calculation.",
    "arguments": [
      {
        "name": "Dividend",
        "description": "The number to be divided.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      },
      {
        "name": "Divisor",
        "description": "The number to divide by.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      }
    ],
    "output": {
      "description": "The result of dividing the dividend with the divisor.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/keyBy": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Key by",
    "description": "Organize an Array of items into an Object based on a Key formula.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Array of items.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The key formula used to index the items. The String returned from the formula will match the key in the output Object.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "An Object where each key matches a value returned by the key formula, and each value is the item that String was returned for.",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/append": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Append",
    "description": "Add an element to the end of an Array.",
    "arguments": [
      {
        "name": "Array",
        "type": {
          "type": "Array"
        },
        "description": "The Array to append to.",
        "formula": {
          "type": "array",
          "arguments": []
        }
      },
      {
        "name": "Item",
        "type": {
          "type": "Any"
        },
        "description": "The item to append to the Array.",
        "formula": {
          "type": "value",
          "value": "Item"
        }
      }
    ],
    "output": {
      "description": "A new Array containing all elements from the input Array, including the new item.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/includes": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Includes",
    "description": "Test if an Array or String includes a specific item or value.and [String.prototype.includes on MDN]() for more information.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The value to search.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Item",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The item or value to search for.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "Returns True if the item or value exists in the Array or string. Returns False if no match is found.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/get": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get",
    "description": "Extract a value from an Object, Array or String at the specified path.",
    "arguments": [
      {
        "name": "Object",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The Object, Array or String you want to extract an item from.",
        "type": {
          "type": "Array \\| Object \\| String"
        }
      },
      {
        "name": "Path",
        "formula": {
          "type": "value",
          "value": "Item"
        },
        "description": "The Path can be either a Number, a String, or an Array.",
        "type": {
          "type": "Array<String> \\| Number \\| String"
        }
      }
    ],
    "output": {
      "description": "The value found at the Path. If no value is found, this value of the output is Null.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/matches": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Matches",
    "description": "Finds the (global) matches in a String based on a regular expression.",
    "arguments": [
      {
        "name": "Input",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The string to search for matches in.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Regular expression",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The regular expression to use for matching.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Global search",
        "formula": {
          "type": "value",
          "value": true
        },
        "description": "Test the regular expression against all possible matches in a string.",
        "type": {
          "type": "Boolean"
        }
      },
      {
        "name": "Case insensitive",
        "formula": {
          "type": "value",
          "value": false
        },
        "description": "Ignore case while attempting a match in a string.",
        "type": {
          "type": "Boolean"
        }
      },
      {
        "name": "Multi line",
        "formula": {
          "type": "value",
          "value": false
        },
        "description": "Treat multiline strings as multiple lines.",
        "type": {
          "type": "Boolean"
        }
      }
    ],
    "output": {
      "description": "An Array of Strings",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/notEqual": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Not equal",
    "description": "Compute if values are not identical.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First value.",
        "type": {
          "type": "Any"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second value.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "Returns True if the values are not identical, otherwise False.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/concatenate": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Concatenate",
    "description": "Concatenate two or more values.",
    "arguments": [
      {
        "name": "0",
        "formula": {
          "type": "value",
          "value": ""
        },
        "type": {
          "type": "Array \\| String \\| Object"
        }
      }
    ],
    "variableArguments": true,
    "output": {
      "type": {
        "type": "Array \\| String \\| Object"
      },
      "description": "Returns a String, Array or Object containing all the specified input values."
    }
  },
  "@toddle/dateFromString": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Date From String",
    "arguments": [
      {
        "name": "Date string",
        "description": "A String representing a date, for example \"January 1, 1970\".",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": "January 1, 1970"
        }
      }
    ],
    "description": "Convert a string to a Date.",
    "output": {
      "description": "The input value converted to a Date.",
      "type": {
        "type": "Date"
      }
    }
  },
  "@toddle/prepend": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Prepend",
    "description": "Add an element to the start of an Array.",
    "arguments": [
      {
        "name": "Array",
        "type": {
          "type": "Array"
        },
        "description": "The Array to prepend to.",
        "formula": {
          "type": "array",
          "arguments": []
        }
      },
      {
        "name": "Item",
        "type": {
          "type": "Any"
        },
        "description": "The item to prepend to the Array.",
        "formula": {
          "type": "value",
          "value": "Item"
        }
      }
    ],
    "output": {
      "description": "A new Array containing the new item and all the elements from the input Array.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/getCookie": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get Cookie",
    "description": "Get the value of a cookie by name. This formula is available both server-side and client-side. Http-Only cookies will only be available server-side.",
    "arguments": [
      {
        "name": "Cookie name",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The name of the cookie you want to get the value of.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The value of the cookie. If a value is not found, this return value will be Null.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/currentURL": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Current URL",
    "description": "Return the current URL of the browser. Use the \"Parse URL\" formula for working with the URL.",
    "arguments": [],
    "cache": false,
    "output": {
      "description": "The browser's current URL.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/reverse": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Reverse",
    "description": "Reverse the order of an Array.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The Array to be reversed.",
        "type": {
          "type": "Array"
        }
      }
    ],
    "output": {
      "type": {
        "type": "Array"
      },
      "description": "The reversed Array."
    }
  },
  "@toddle/max": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Max",
    "description": "Find the largest Number from a list of inputs.",
    "arguments": [
      {
        "name": "0",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input Number.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "1",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input Number.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "variableArguments": true,
    "output": {
      "description": "The largest of the input Numbers.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/languages": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Languages",
    "description": "An array of the preferred languages for the user, based on the Navigator.languages property (on the client) or the Accept-Language header (on the server).",
    "arguments": [],
    "output": {
      "description": "An array with the preferred languages for the user.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/trim": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Trim",
    "description": "Remove any leading and trailing white spaces from a String.",
    "arguments": [
      {
        "name": "String",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The String to trim.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The trimmed String.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/groupBy": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Group by",
    "description": "Group an Array of items into an Object based on a grouping formula.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Array of items to be grouped.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The grouping formula used to group the items. The String returned from the formula will match the key in the output Oject.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "An Object where each key matches a value returned by the grouping formula, and each value is the list of items that share the return value.",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/number": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Number",
    "description": "Convert a value of any type to a Number.",
    "arguments": [
      {
        "name": "Input",
        "description": "Value of any type",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": "1"
        }
      }
    ],
    "output": {
      "description": "The input value converted to a Number.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/equals": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Equals",
    "description": "Compute if values are identical.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First Value",
        "type": {
          "type": "Any"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second Value",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "Returns True if the input values are identical, otherwise False.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/getFromSessionStorage": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get from Session Storage",
    "description": "Read a value from session storage with the provided key.\nIf the value is a JSON string it is automatically parsed before it is returned.\nYou do not need to use the parseJSON formula",
    "cache": false,
    "arguments": [
      {
        "name": "Key",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The key to read from session storage.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The value found in session storage.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/uppercase": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Uppercase",
    "description": "Convert a String to uppercase.",
    "arguments": [
      {
        "name": "String",
        "formula": {
          "type": "value",
          "value": "string"
        },
        "description": "Input String.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The input String with all characters converted to uppercase.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/drop": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Drop",
    "description": "Remove items from the beginning of an Array or String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input value.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Count",
        "description": "Number of items to remove.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      }
    ],
    "output": {
      "description": "A copy of the list without the first items.",
      "type": {
        "type": "Array \\| String"
      }
    }
  },
  "@toddle/map": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Map",
    "description": "Run a formula on each item of an Array to return a new Array.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The Array of items.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "The formula to run on each item of the Array.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "A new Array containing all the values returned from running the provided formula on each item in the provided input Array.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/json": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "JSON",
    "description": "Convert a value into a JSON String.",
    "arguments": [
      {
        "name": "Input",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input value.",
        "type": {
          "type": "Any"
        }
      },
      {
        "name": "Indentation",
        "formula": {
          "type": "value",
          "value": 0
        },
        "description": "The number of spaces used for indentation in the JSON String.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The JSON String.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/flatten": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Flatten",
    "description": "Flatten a nested Array.",
    "arguments": [
      {
        "name": "Array",
        "description": "An Array containing one or more Arrays.",
        "type": {
          "type": "Array"
        },
        "formula": {
          "type": "array",
          "arguments": []
        }
      }
    ],
    "output": {
      "description": "A flattened Array where all items in the original array are concatenated.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/add": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Add",
    "arguments": [
      {
        "name": "0",
        "description": "Number to be added.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      },
      {
        "name": "1",
        "type": {
          "type": "Number"
        },
        "description": "Number to be added.",
        "formula": {
          "type": "value",
          "value": 1
        }
      }
    ],
    "variableArguments": true,
    "description": "Get the sum of multiple numbers.",
    "output": {
      "description": "The sum of all the input numbers.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/clamp": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Clamp",
    "description": "Limit a value to a specified Min and Max value.",
    "arguments": [
      {
        "name": "Value",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Number to round."
      },
      {
        "name": "Min",
        "type": {
          "type": "Number"
        },
        "description": "The smallest allowed Number.",
        "formula": {
          "type": "value",
          "value": 0
        }
      },
      {
        "name": "Max",
        "type": {
          "type": "Number"
        },
        "description": "The largest allowed Number.",
        "formula": {
          "type": "value",
          "value": 100
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "Returns the input value if between the specified Min and Max. Otherwise, it returns the Min or Max value."
    }
  },
  "@toddle/sum": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Sum",
    "description": "Return the sum of an Array of numbers.",
    "arguments": [
      {
        "name": "Array",
        "type": {
          "type": "Array"
        },
        "description": "The array of numbers to sum.",
        "formula": {
          "type": "array",
          "arguments": []
        }
      }
    ],
    "output": {
      "description": "The total sum from adding all the numbers in the Array.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/take": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Take",
    "description": "Take items from the start of an Array or String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input Array or String.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Count",
        "formula": {
          "type": "value",
          "value": 1
        },
        "type": {
          "type": "Number"
        },
        "description": "Number of items to take."
      }
    ],
    "output": {
      "description": "The first items from the Array or String.",
      "type": {
        "type": "Array \\| String"
      }
    }
  },
  "@toddle/now": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Now",
    "description": "Get a Date representing \"Now\".",
    "arguments": [],
    "cache": false,
    "output": {
      "description": "A Date object initialized at the current date/time.",
      "type": {
        "type": "Date"
      }
    }
  },
  "@toddle/canShare": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Can Share",
    "description": "Return a Boolean indicating whether the provided data can be shared (with the \"Share\" action).",
    "arguments": [
      {
        "name": "URL",
        "description": "The URL you want to check.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Title",
        "description": "The title you want to check.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Text",
        "description": "The text you want to check.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ]
  },
  "@toddle/boolean": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Boolean",
    "description": "Convert a value of any type to a Boolean.",
    "arguments": [
      {
        "name": "Input",
        "description": "Value of any type.",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": "1"
        }
      }
    ],
    "output": {
      "description": "The input value converted to a Boolean. False and Null will return False, all other values will return True.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/decodeBase64": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Decode base64",
    "arguments": [
      {
        "name": "Base64 value",
        "formula": {
          "type": "value",
          "value": "Input value"
        },
        "type": {
          "type": "String"
        },
        "description": "The input data encoded as base64."
      }
    ],
    "description": "Deocde a base64 string to utf-8.",
    "output": {
      "description": "The decoded string.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/lessThan": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Less than",
    "description": "Compute if a value is smaller than another value.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First Number to be compared.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second Number to be compared.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "Returns True if the First Number is smaller than the second Number, otherwise it returns False.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/greaterOrEqueal": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Greater or equal",
    "description": "Compute whether a value is larger than or equal to another value.",
    "arguments": [
      {
        "name": "First",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "First value to be compared.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Second",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "Second value to be compared.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "Returns True if the first Number is larger than or equal to the second Number.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/absolute": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Absolute",
    "description": "Get the absolute value of a Number.",
    "arguments": [
      {
        "name": "Value",
        "formula": {
          "type": "value",
          "value": -1
        },
        "type": {
          "type": "Number"
        },
        "description": "The input Number."
      }
    ],
    "output": {
      "description": "The absolute value of the input.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/lastIndexOf": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Last Index of",
    "description": "Search an Array or String to find the index of the last occurrence of a specified item or substring.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The value to search.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Item",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The item or substring to search for.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "If the item or substring exists in the Array, the last index of that item is returned. If the item is not found, -1 is returned.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/sort_by": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Sort by",
    "description": "Sort an Array using a formula.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": []
        },
        "type": {
          "type": "Array"
        },
        "description": "The input Array."
      },
      {
        "name": "Formula",
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "type": {
          "type": "Formula"
        },
        "isFunction": true,
        "description": "The sorting formula. The output of this formula will determine the sort order of the items. If the formula returns an Array, the items will first be sorted by the first item, then the second, etc."
      },
      {
        "name": "Ascending?",
        "formula": {
          "type": "value",
          "value": true
        },
        "type": {
          "type": "Boolean"
        },
        "description": "Should the list be sorted in ascending order?"
      }
    ],
    "output": {
      "description": "The input Array sorted by the value returned by the sorting formula.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/lowercase": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Lower case",
    "description": "Convert a string to lowercase.",
    "arguments": [
      {
        "name": "String",
        "formula": {
          "type": "value",
          "value": "string"
        },
        "description": "Input String",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The input String with all characters converted to lowercase.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/encodeURIComponent": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Encode URI Component",
    "description": "Encode a URI component, escaping certain characters to their UTF-8 representation.",
    "arguments": [
      {
        "name": "URIComponent",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The URI component to encode.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The encoded URI component.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/Id": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Id",
    "description": "Generate a unique, consistent identifier.",
    "arguments": [],
    "cache": false,
    "output": {
      "description": "A unique identifier.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/string": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "String",
    "description": "Convert a value of any type to a String.",
    "arguments": [
      {
        "name": "Input",
        "description": "Value of any type.",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": "1"
        }
      }
    ],
    "output": {
      "description": "The input value converted to a String",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/takeLast": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Take last",
    "description": "Take items from the end of an Array or String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input value.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Count",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "Number of items to take.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The last items from the Array or String.",
      "type": {
        "type": "Array \\| String"
      }
    }
  },
  "@toddle/find": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Find",
    "description": "Search through an Array of items and apply a formula to each item, to return the first item where the provided formula returns True.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The array to search through",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "The predicate formula that each item in the array is passed to.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "The first item in the Array where the formula returns True. Returns Null if the predicate formula did not return True for any item.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/size": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Size",
    "description": "Get the size of an Array, Object or String.",
    "arguments": [
      {
        "name": "Collection",
        "formula": {
          "type": "value",
          "value": [
            1,
            2,
            3
          ]
        },
        "description": "The collection to get the size of.",
        "type": {
          "type": "Array \\| Object \\| String"
        }
      }
    ],
    "output": {
      "description": "The size of the collection.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/filter": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Filter",
    "description": "Return a new Array containing only the elements for which the provided formula evaluates to True.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The array of items to be filtered.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "Predicate formula for filtering items.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "New Array containing only the items for which the Formula evaluated to True.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/set": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Set",
    "description": "Set a value in an Object or Array based on a specified path.",
    "arguments": [
      {
        "name": "Object",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input Object.",
        "type": {
          "type": "Object"
        }
      },
      {
        "name": "Path",
        "formula": {
          "type": "value",
          "value": "Key"
        },
        "description": "The Path can be either a Number, a String or an Array of Strings.",
        "type": {
          "type": "Array \\| Number \\| String"
        }
      },
      {
        "name": "Value",
        "formula": {
          "type": "value",
          "value": "Item"
        },
        "description": "The value to set.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "The input Object with the new field.",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/fromEntries": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "From entries",
    "description": "Transform an Array of key-value pairs into an Object. This formula is the reverse of Entries.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "An Array of Objects. Each Object should have a `key` and `value` property named `key` and `value` respectively e.g. `[{ key: 'yourKey', value: 'yourValue' }]`.",
        "type": {
          "type": "Array"
        }
      }
    ],
    "output": {
      "description": "An Object containing all entries from the input Array in the format `{yourKey: yourValue}`.",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/range": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Range",
    "description": "Create an Array of numbers between a Min and Max value.",
    "arguments": [
      {
        "formula": {
          "type": "value",
          "value": 0
        },
        "name": "Min",
        "description": "The smallest value in the list.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Max",
        "formula": {
          "type": "value",
          "value": 10
        },
        "description": "The largest value in the list.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "An Array containing all the numbers between Min and Max, inclusive.",
      "type": {
        "type": "Array"
      }
    }
  },
  "@toddle/timestamp": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Timestamp",
    "description": "Get the timestamp from a Date, e.g. 1633462980000.",
    "arguments": [
      {
        "name": "Date",
        "description": "The date to get the timestamp from.",
        "type": {
          "type": "Date"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ],
    "output": {
      "description": "The timestamp from the date input.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/parseURL": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Parse URL",
    "description": "Parse a URL.",
    "arguments": [
      {
        "name": "URL",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The URL value to parse.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Base",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "An optional base for the URL. Use this to resolve relative URLs.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "An object containing: \"hostname\", \"searchParams\", \"path\", \"hash\", \"href\", \"protocol\", \"port\", \"origin\"",
      "type": {
        "type": "Object"
      }
    }
  },
  "@toddle/logarithm": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Logarithm",
    "description": "Return the logarithm of a Number.",
    "arguments": [
      {
        "name": "Number",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "A Number greater than or equal to 0.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "The natural logarithm of the Number."
    }
  },
  "@toddle/roundDown": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Round down",
    "description": "Round a Number down to the nearest decimal point.",
    "arguments": [
      {
        "name": "Input",
        "description": "Number to round down.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      },
      {
        "name": "Decimals",
        "description": "Number of decimals to round to.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 0
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "The rounded Number."
    }
  },
  "@toddle/encodeJSON": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Encode JSON",
    "description": "Encode data as JSON.",
    "arguments": [
      {
        "name": "Data",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The data to convert.",
        "type": {
          "type": "Any"
        }
      },
      {
        "name": "Indent",
        "formula": {
          "type": "value",
          "value": 2
        },
        "description": "How many characters the encoded value will be indented.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The encoded JSON value.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/modulo": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Modulo",
    "description": "Get the remainder when dividing two Numbers.",
    "arguments": [
      {
        "name": "Dividend",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The number to be divided.",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "Divider",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The number to divide by.",
        "type": {
          "type": "Number"
        }
      }
    ],
    "output": {
      "description": "The remainder when the Dividend is divided by the Divider.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/capitalize": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Capitalize",
    "description": "Capitalize a string: make the first letter uppercase whilst keeping the rest lowercase.",
    "arguments": [
      {
        "name": "String",
        "formula": {
          "type": "value",
          "value": "string"
        },
        "description": "An input String.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The capitalized String.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/some": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Some",
    "description": "Run a formula on all items of an Array to determine if any item matches a set of conditions.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The Array of items to evaluate.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "Predicate formula for evaluating each item.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "Returns True if the predicate formula returns True for any items in the Array, otherwise False.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/isServer": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Is Server",
    "description": "Get information about whether formulas are currently evaluated server-side or client-side.",
    "arguments": [],
    "output": {
      "description": "Returns True if formulas are evaluated server-side, and False if formulas are evaluated client-side.",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/getElementById": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get element by id",
    "description": "Return a DOM element with a given id.",
    "cache": false,
    "arguments": [
      {
        "name": "Id",
        "formula": {
          "type": "value",
          "value": "element-id"
        },
        "type": {
          "type": "String"
        },
        "description": "The id of the DOM element to return."
      }
    ],
    "output": {
      "description": "The DOM element with the given id. If no DOM element is found, this will return Null.",
      "type": {
        "type": "Element"
      }
    }
  },
  "@toddle/randomNumber": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Random number",
    "description": "Return a random Number between 0 and 1.",
    "arguments": [],
    "cache": false,
    "output": {
      "description": "A random Number between 0 and 1.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/min": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Min",
    "description": "Find the smallest Number from a list of inputs.",
    "arguments": [
      {
        "name": "0",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input number",
        "type": {
          "type": "Number"
        }
      },
      {
        "name": "1",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "Input number",
        "type": {
          "type": "Number"
        }
      }
    ],
    "variableArguments": true,
    "output": {
      "description": "The smallest of the input Numbers.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/dropLast": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Drop last",
    "description": "Remove item(s) from the end of an Array or String.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The input value.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Count",
        "formula": {
          "type": "value",
          "value": 1
        },
        "type": {
          "type": "Number"
        },
        "description": "Number of items to remove."
      }
    ],
    "output": {
      "description": "A copy of the list without the last item(s).",
      "type": {
        "type": "Array \\| String"
      }
    }
  },
  "@toddle/formatNumber": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Format Number",
    "arguments": [
      {
        "name": "Input",
        "description": "Number to format.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 100
        }
      },
      {
        "name": "Locale(s)",
        "description": "Optional locale to use for formatting the Number, e.g. \"en\" or \"fr\". Multiple locales can be provided (as an Array of Strings) to provide a fallback locale. The default value is the runtime's locale.",
        "type": {
          "type": "Array \\| String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Options",
        "description": "Optional Object for configuring the formatting of the output. See the [NumberFormat locale options on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#locale_options).",
        "type": {
          "type": "Object"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ],
    "description": "Format a Number using the Intl.NumberFormat API. See the [NumberFormat docs on MDN]().",
    "output": {
      "description": "The Number input formatted as a String.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/round": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Round",
    "description": "Round a Number to the nearest decimal point.",
    "arguments": [
      {
        "name": "Input",
        "description": "Number to round.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      },
      {
        "name": "Decimals",
        "description": "Number of decimals to round to.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 0
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "The rounded Number."
    }
  },
  "@toddle/startsWith": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Starts with",
    "description": "Check if a String has a given prefix.",
    "arguments": [
      {
        "name": "String",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The String to check.",
        "type": {
          "type": "String"
        }
      },
      {
        "name": "Prefix",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The prefix to check for.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "Returns True if the input String starts with the prefix, otherwise False",
      "type": {
        "type": "Boolean"
      }
    }
  },
  "@toddle/replaceAll": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Replace all",
    "description": "Replace all occurrences of a substring in a String.",
    "arguments": [
      {
        "name": "Input",
        "description": "The input String to search in.",
        "type": {
          "type": "String"
        },
        "required": true
      },
      {
        "name": "Search",
        "description": "The substring to search for.",
        "type": {
          "type": "String"
        },
        "required": true
      },
      {
        "name": "Replace with",
        "description": "The replacement value.",
        "type": {
          "type": "String"
        },
        "required": true
      }
    ],
    "output": {
      "type": {
        "type": "String"
      },
      "name": "Output",
      "description": "The resulting String."
    }
  },
  "@toddle/findLast": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Find Last",
    "description": "Search through an Array of items and apply a formula to each item, to return the last item where the formula returns True.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The array to search.",
        "type": {
          "type": "Array"
        }
      },
      {
        "name": "Formula",
        "isFunction": true,
        "formula": {
          "type": "path",
          "path": [
            "Args",
            "item"
          ]
        },
        "description": "The predicate formula that each item in the Array is passed to.",
        "type": {
          "type": "Formula"
        }
      }
    ],
    "output": {
      "description": "The last item in the Array where the formula returns True. Returns Null if the predicate formula did not return True for any item.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/typeOf": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Type of",
    "description": "Get the type of a given input.",
    "arguments": [
      {
        "name": "Input",
        "formula": {
          "type": "value",
          "value": 1
        },
        "description": "The input value.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "The type of the input value. Types can be one of: String, Boolean, Number, Array, Object, or Null.",
      "type": {
        "type": "Any"
      }
    }
  },
  "@toddle/roundUp": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Round up",
    "description": "Round a Number up to the nearest decimal point.",
    "arguments": [
      {
        "name": "Input",
        "description": "Number to round up.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1
        }
      },
      {
        "name": "Decimals",
        "description": "Number of decimals to round to.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 0
        }
      }
    ],
    "output": {
      "type": {
        "type": "Number"
      },
      "description": "The rounded Number."
    }
  },
  "@toddle/formatDate": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Format Date",
    "arguments": [
      {
        "name": "Date",
        "description": "Date to format",
        "type": {
          "type": "Date"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Locale(s)",
        "description": "Optional locale to use for formatting the Date, e.g. \"en\" or \"fr\". Multiple locales can be provided (as an Array of Strings) to provide a fallback locale. The default value is the runtime's locale.",
        "type": {
          "type": "Array \\| String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Options",
        "description": "Optional Object for configuring the formatting of the output. See the [DateTimeFormat syntax on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#syntax).",
        "type": {
          "type": "Object"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ],
    "description": "Format a date using the Intl.DateTimeFormat API. See the [DateTimeFormat docs on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).",
    "output": {
      "description": "The Date input formatted as a String.",
      "type": {
        "type": "String"
      }
    }
  },
  "@toddle/indexOf": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Index of",
    "description": "Find the index of a specific item in an Array or String.and [String.prototype.indexOf on MDN]() for more information.",
    "arguments": [
      {
        "name": "Array",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The value to search.",
        "type": {
          "type": "Array \\| String"
        }
      },
      {
        "name": "Item",
        "formula": {
          "type": "value",
          "value": ""
        },
        "description": "The items to search for.",
        "type": {
          "type": "Any"
        }
      }
    ],
    "output": {
      "description": "If the item exists in the Array, the index of that item is returned. If the item is not found, -1 is returned.",
      "type": {
        "type": "Number"
      }
    }
  },
  "@toddle/getHttpOnlyCookie": {
    "$schema": "../../schemas/libFormula.schema.json",
    "name": "Get Http-Only Cookie",
    "description": "Get the value of an Http-Only cookie by name. This formula is only intended to be used server-side for SSR/proxied API requests to read Http-Only cookies.",
    "arguments": [
      {
        "name": "Cookie name",
        "formula": {
          "type": "value",
          "value": null
        },
        "description": "The name of the Http-Only cookie you want to get the value of.",
        "type": {
          "type": "String"
        }
      }
    ],
    "output": {
      "description": "The value of the cookie. If no cookie is found, this will return Null. If you use this formula client-side, it will return a placeholder template string.",
      "type": {
        "type": "String"
      }
    }
  }
};
    export const actions = {
  "@toddle/saveToLocalStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Save to local storage",
    "description": "Save a provided key/value to local storage by JSON encoding the value.",
    "group": "local_storage",
    "arguments": [
      {
        "name": "Key",
        "description": "The key to be used in local storage.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Value",
        "description": "The value that should be saved in local storage. This can be anything that is serializable (String, Number, Boolean, Array or Object).",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ]
  },
  "@toddle/setCookie": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Set cookie",
    "description": "Save a key/value pair as a non-http-only cookie (readable on the client). Useful for storing user preferences.",
    "group": "cookies",
    "arguments": [
      {
        "name": "Name",
        "description": "The name of the cookie.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Value",
        "description": "The value to be stored in the cookie.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Expires in",
        "description": "(Optional) Time in seconds until the cookie expires. If this is null, the cookie will expire at the end of the user's session.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "SameSite",
        "description": "(Optional) The SameSite attribute of the cookie. Defaults to Lax.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Path",
        "description": "(Optional) The Path attribute of the cookie. Defaults to /.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Include Subdomains",
        "description": "(Optional) Whether to include subdomains when setting the cookie. Defaults to true.",
        "type": {
          "type": "Boolean"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ],
    "events": {
      "Success": {
        "description": "This event is triggered once the cookie has been saved.",
        "actions": []
      },
      "Error": {
        "description": "This event is triggered if the cookie could not be saved.",
        "actions": []
      }
    }
  },
  "@toddle/sleep": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Sleep",
    "description": "Run an action after a delay.",
    "group": "timers",
    "arguments": [
      {
        "name": "Delay in milliseconds",
        "description": "The number of milliseconds to wait before an action is executed.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 500
        }
      }
    ],
    "events": {
      "tick": {
        "actions": []
      }
    }
  },
  "@toddle/interval": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Interval",
    "description": "Run an action every \"delay\" milliseconds.",
    "group": "timers",
    "arguments": [
      {
        "name": "Interval in milliseconds",
        "description": "The interval \"delay\".",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": 1000
        }
      }
    ],
    "events": {
      "tick": {
        "actions": []
      }
    }
  },
  "@toddle/logToConsole": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Log to console",
    "description": "Log a message to the browser console.",
    "group": "debugging",
    "arguments": [
      {
        "name": "Label",
        "description": "A label for the message.",
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Data",
        "type": {
          "type": "Any"
        },
        "description": "The data you want to log to the console.",
        "formula": {
          "type": "value",
          "value": "<Data>"
        }
      }
    ]
  },
  "@toddle/deleteFromLocalStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Delete from local storage",
    "description": "Delete a value from local storage (if found) based on the provided key.",
    "group": "local_storage",
    "arguments": [
      {
        "name": "Key",
        "description": "The key in local storage to delete.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      }
    ]
  },
  "@toddle/setTheme": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Set theme",
    "description": "Sets the application theme. Call with null to reset. This action automatically sets a theme-cookie so the theme persists across sessions. Note: This action is currently only supported when the \"style-variables-v2\" feature flag is enabled.",
    "group": "theming",
    "arguments": [
      {
        "name": "Name",
        "description": "The name of the theme.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      }
    ],
    "events": {
      "Success": {
        "description": "This event is triggered once the theme has been set.",
        "actions": []
      },
      "Error": {
        "description": "This event is triggered if the theme could not be set. Usually due to an invalid theme name or a cookie issue.",
        "actions": []
      }
    }
  },
  "@toddle/focus": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Focus",
    "description": "Move focus to a DOM element.",
    "group": "events",
    "arguments": [
      {
        "name": "Element",
        "description": "The DOM element that should receive focus.",
        "type": {
          "type": "Element"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Prevent scroll",
        "description": "Prevent scrolling to the focused element.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ]
  },
  "@toddle/preventDefault": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Prevent default",
    "docs-link": "https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault",
    "description": "Prevent default browser behavior for this event.",
    "group": "events",
    "arguments": []
  },
  "@toddle/clearLocalStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Clear local storage",
    "description": "Delete all values in local storage.",
    "group": "local_storage",
    "arguments": []
  },
  "@toddle/setHttpOnlyCookie": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Set HttpOnly cookie",
    "description": "Save a key/value pair as an Http-Only cookie. Useful for storing JWTs or other tokens.",
    "group": "cookies",
    "arguments": [
      {
        "name": "Name",
        "description": "The name of the cookie.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": "access_token"
        }
      },
      {
        "name": "Value",
        "description": "The value to be stored in the cookie.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Expires in",
        "description": "(Optional) Time in seconds until the cookie expires. This should be null for JWTs to use the JWT's expiration. If not provided, the cookie will be a session cookie. If set to 0, the cookie will be deleted.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "SameSite",
        "description": "(Optional) The SameSite attribute of the cookie. Defaults to Lax.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Path",
        "description": "(Optional) The Path attribute of the cookie. Defaults to /.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Include Subdomains",
        "description": "(Optional) Whether to include subdomains when setting the cookie. Defaults to true.",
        "type": {
          "type": "Boolean"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ],
    "events": {
      "Success": {
        "description": "This event is triggered once the cookie has been saved.",
        "actions": []
      },
      "Error": {
        "description": "This event is triggered if the cookie could not be saved.",
        "actions": []
      }
    }
  },
  "@toddle/copyToClipboard": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Copy to clipboard",
    "description": "Copy contents to the clipboard.",
    "group": "sharing",
    "arguments": [
      {
        "name": "Value",
        "description": "The value you want to copy.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": "<Param Value>"
        }
      }
    ]
  },
  "@toddle/gotToURL": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Go to URL",
    "description": "Navigate to a specified URL.",
    "group": "navigation",
    "arguments": [
      {
        "name": "URL",
        "description": "The URL to navigate to.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": "https://example.com"
        }
      }
    ]
  },
  "@toddle/clearSessionStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Clear session storage",
    "description": "Delete all values in session storage.",
    "group": "session_storage",
    "arguments": []
  },
  "@toddle/setSessionCookies": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Set session cookies",
    "description": "Save authentication tokens as session cookies.",
    "deprecated": true,
    "supercededBy": "Set HttpOnly cookie",
    "group": "cookies",
    "arguments": [
      {
        "name": "Access token",
        "description": "Access tokens are the most common way to authenticate with a server.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Expires in",
        "description": "(Optional) Time in seconds until the token expires. Defaults to 3600 (1 hour). This should be left blank for JWTs.",
        "type": {
          "type": "Number"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      }
    ],
    "events": {
      "Success": {
        "description": "This event is triggered once the tokens have been saved.",
        "actions": []
      },
      "Error": {
        "description": "This event is triggered if Nordcraft is unable to set the session cookies.",
        "actions": []
      }
    }
  },
  "@toddle/deleteFromSessionStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Delete from session storage",
    "description": "Delete a value from session storage (if found) based on the provided key.",
    "group": "session_storage",
    "arguments": [
      {
        "name": "Key",
        "description": "The key in session storage to delete.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      }
    ]
  },
  "@toddle/saveToSessionStorage": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Save to session storage",
    "description": "Save a provided key/value to session storage by JSON encoding the value.",
    "group": "session_storage",
    "arguments": [
      {
        "name": "Key",
        "description": "The key to be used in session storage.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": ""
        }
      },
      {
        "name": "Value",
        "description": "The value that should be saved in session storage. This can be anything that is serializable (String, Number, Boolean, Array or Object).",
        "type": {
          "type": "Any"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ]
  },
  "@toddle/stopPropagation": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Stop propagation",
    "docs-link": "https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation",
    "description": "Stop the event from bubbling up the DOM to parent elements.",
    "group": "events",
    "arguments": []
  },
  "@toddle/share": {
    "$schema": "../../schemas/libAction.schema.json",
    "name": "Share",
    "description": "Share data with title, text, and/or URL using the Navigator.share API.",
    "group": "sharing",
    "arguments": [
      {
        "name": "URL",
        "description": "The URL to share.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Title",
        "description": "The title to share.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      },
      {
        "name": "Text",
        "description": "The text to share.",
        "type": {
          "type": "String"
        },
        "formula": {
          "type": "value",
          "value": null
        }
      }
    ]
  }
};
