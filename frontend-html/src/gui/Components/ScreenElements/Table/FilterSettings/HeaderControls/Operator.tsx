/*
Copyright 2005 - 2021 Advantage Solutions, s. r. o.

This file is part of ORIGAM (http://www.origam.org).

ORIGAM is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ORIGAM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ORIGAM. If not, see <http://www.gnu.org/licenses/>.
*/

import React from "react";
import { T } from "utils/translation";

export class Operator {
  static operators: Operator[] = []

  private captionGetter: () => JSX.Element;
  private _caption: JSX.Element | undefined;

  get caption() {
    if (this._caption === undefined) {
      this._caption = this.captionGetter();
    }
    return this._caption;
  }

  constructor(
    public type: string,
    public numberValue: number,
    captionGetter: () => JSX.Element) {
    this.captionGetter = captionGetter;
    Operator.operators.push(this);
  }

  static equals = new Operator("eq", 1, () => <>=</>)
  static between = new Operator("between", 2, () => <>{T("between", "filter_operator_between")}</>)
  static startsWith = new Operator("starts", 3, () => <>{T("begins with", "filter_operator_begins_with")}</>)
  static endsWith = new Operator("ends", 4, () => <>{T("ends with", "filter_operator_ends_with")}</>)
  static contains = new Operator("contains", 5, () => <>{T("contains", "filter_operator_contains")}</>)
  static greaterThan = new Operator("gt", 6, () => <>&#62;</>)
  static lessThan = new Operator("lt", 7, () => <>&#60;</>)
  static greaterThanOrEquals = new Operator("gte", 8, () => <>&ge;</>)
  static lessThanOrEquals = new Operator("lte", 9, () => <>&le;</>)
  static notEquals = new Operator("neq", 10, () => <>&ne;</>)
  static notBetween = new Operator("nbetween", 11, () => <>{T("not between", "filter_operator_not_between")}</>)
  static notStartsWith = new Operator("nstarts", 12, () => <>{T("not begins with", "filter_operator_not_begins_with")}</>)
  static notEndsWith = new Operator("nends", 13, () => <>{T("not ends with", "filter_operator_not_ends_with")}</>)
  static notContains = new Operator("ncontains", 14, () => <>{T("not contains", "filter_operator_not_contains")}</>)
  static isNull = new Operator("null", 15, () => <>{T("is null", "filter_operator_is_null")}</>)
  static isNotNull = new Operator("nnull", 16, () => <>{T("is not null", "filter_operator_not_is_null")}</>)

  static in = new Operator("in", 1, () => <>=</>)
  static notIn = new Operator("nin", 10, () => <>&ne;</>)

  static fromNumber(operatorNumber: number) {
    const operator = Operator.operators.find(operator => operator.numberValue === operatorNumber);
    if (!operator) {
      throw new Error("Cannot find string value for filter operator number: " + operatorNumber);
    }
    return operator;
  }
}

const filterMapComboBox = new Map<number, string>([
  [1, "in"],
  [10, "nin"]
]);
const filterMap = new Map<number, string>([
  [0, "none"],
  [1, "eq"],
  [2, "between"],
  [3, "starts"],
  [4, "ends"],
  [5, "contains"],
  [6, "gt"],
  [7, "lt"],
  [8, "gte"],
  [9, "lte"],
  [10, "neq"],
  [11, "nbetween"],
  [12, "nstarts"],
  [13, "nends"],
  [14, "ncontains"],
  [15, "null"],
  [16, "nnull"],
]);

export function filterTypeToNumber(filterType: string) {
  const typeNumber = Array.from(filterMap)
      .find(entry => entry[1] === filterType)?.[0]
    ?? Array.from(filterMapComboBox)
      .find(entry => entry[1] === filterType)?.[0]
  if (!typeNumber) {
    throw new Error("Cannot find filter operator number for filter type: " + filterType)
  }
  return typeNumber;
}

export function filterTypeFromNumber(filterOperatorNum: number, columnType: string) {
  const stringValue = columnType === "ComboBox"
    ? filterMapComboBox.get(filterOperatorNum) ?? filterMap.get(filterOperatorNum)
    : filterMap.get(filterOperatorNum);
  if (!stringValue) {
    throw new Error("Cannot find string value for filter operator number: " + filterOperatorNum)
  }
  return stringValue;
}


