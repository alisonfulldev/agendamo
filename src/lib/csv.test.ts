import { describe, expect, it } from "vitest";

import { mapCustomerHeaders, parseBirthdate, parseCsv, toCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("reads semicolon files with BOM, quotes and CRLF", () => {
    const text =
      '﻿Nome;Telefone;E-mail\r\n"Silva; Maria";(11) 99999-8888;maria@x.com\r\n\r\nJoão;11988887777;\r\n';
    expect(parseCsv(text)).toEqual([
      ["Nome", "Telefone", "E-mail"],
      ["Silva; Maria", "(11) 99999-8888", "maria@x.com"],
      ["João", "11988887777", ""],
    ]);
  });

  it("reads comma files with escaped quotes", () => {
    expect(parseCsv('name,notes\nAna,"disse ""oi"""')).toEqual([
      ["name", "notes"],
      ["Ana", 'disse "oi"'],
    ]);
  });
});

describe("toCsv", () => {
  it("quotes when needed and neutralizes formulas", () => {
    const csv = toCsv([
      ["Nome", "Obs"],
      ["Ana; Silva", "=HYPERLINK(1)"],
    ]);
    expect(csv).toBe('﻿Nome;Obs\r\n"Ana; Silva";\'=HYPERLINK(1)\r\n');
  });
});

describe("mapCustomerHeaders", () => {
  it("recognizes Portuguese headers with or without accents", () => {
    expect(mapCustomerHeaders(["Nome", "WhatsApp", "E-mail", "Aniversário"])).toEqual({
      name: 0,
      phone: 1,
      email: 2,
      birthdate: 3,
    });
  });

  it("requires name and phone", () => {
    expect(mapCustomerHeaders(["Nome", "E-mail"])).toBeNull();
  });
});

describe("parseBirthdate", () => {
  it.each([
    ["31/12/1990", "1990-12-31"],
    ["1990-12-31", "1990-12-31"],
    ["5/3/1985", "1985-03-05"],
    ["31/02/1990", null],
    ["ontem", null],
    ["", null],
  ])("%s -> %s", (input, expected) => {
    expect(parseBirthdate(input)).toBe(expected);
  });
});
