import { describe, expect, it } from "vitest";
import { extractJsonObject, parseAnalysisResult } from "./analyse-parse";
import { analysisResult } from "@/test/fixtures";

describe("extractJsonObject", () => {
  it("returns a bare JSON object unchanged", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips surrounding prose", () => {
    expect(extractJsonObject('Sure! Here you go:\n{"a":1}\nHope that helps.')).toBe('{"a":1}');
  });

  it("strips markdown fences", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("keeps nested braces intact", () => {
    const json = '{"a":{"b":[1,2]},"c":"}"}';
    expect(JSON.parse(extractJsonObject(json))).toEqual(JSON.parse(json));
  });

  it("throws when there is no object at all", () => {
    expect(() => extractJsonObject("no json here")).toThrow(/No JSON object/);
  });
});

describe("parseAnalysisResult", () => {
  it("parses a complete result", () => {
    expect(parseAnalysisResult(JSON.stringify(analysisResult))).toEqual(analysisResult);
  });

  it("parses a result wrapped in prose", () => {
    const wrapped = `Here is the analysis:\n${JSON.stringify(analysisResult)}`;
    expect(parseAnalysisResult(wrapped).listing.brand).toBe("Carhartt");
  });

  it("throws on malformed JSON", () => {
    expect(() => parseAnalysisResult('{"listing": ')).toThrow();
  });

  it("throws when listing is missing", () => {
    const { listing: _omitted, ...rest } = analysisResult;
    expect(() => parseAnalysisResult(JSON.stringify(rest))).toThrow(/missing required/);
  });

  it("throws when tag_data is missing", () => {
    const { tag_data: _omitted, ...rest } = analysisResult;
    expect(() => parseAnalysisResult(JSON.stringify(rest))).toThrow(/missing required/);
  });
});
