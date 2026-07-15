"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, textAreaClass, buttonClass } from "./shared";

function validateSchema(data: unknown, schema: Record<string, unknown>, path = ""): string[] {
  const errors: string[] = [];
  const type = schema.type as string | undefined;

  if (type === "object" && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const required = (schema.required as string[]) || [];
    const properties = (schema.properties as Record<string, unknown>) || {};
    const obj = data as Record<string, unknown>;

    for (const key of required) {
      if (!(key in obj)) errors.push(`${path}.${key} is required`);
    }

    for (const [key, subSchema] of Object.entries(properties)) {
      if (key in obj) {
        errors.push(...validateSchema(obj[key], subSchema as Record<string, unknown>, `${path}.${key}`));
      }
    }
  } else if (type === "array" && Array.isArray(data)) {
    const items = schema.items as Record<string, unknown> | undefined;
    if (items) {
      data.forEach((item, i) => {
        errors.push(...validateSchema(item, items, `${path}[${i}]`));
      });
    }
  } else if (type && typeof data !== type) {
    errors.push(`${path || "root"}: expected ${type}, got ${typeof data}`);
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(data)) {
      errors.push(`${path || "root"}: must be one of ${schema.enum.join(", ")}`);
    }
  }

  if (typeof data === "string") {
    if (schema.minLength && data.length < (schema.minLength as number)) {
      errors.push(`${path}: min length is ${schema.minLength}`);
    }
    if (schema.maxLength && data.length > (schema.maxLength as number)) {
      errors.push(`${path}: max length is ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern as string).test(data)) {
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
    }
  }

  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < (schema.minimum as number)) {
      errors.push(`${path}: must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > (schema.maximum as number)) {
      errors.push(`${path}: must be <= ${schema.maximum}`);
    }
  }

  return errors;
}

const sampleJson = '{\n  "name": "Ada Lovelace",\n  "age": 36,\n  "email": "ada@example.com"\n}';
const sampleSchema = '{\n  "type": "object",\n  "required": ["name", "email"],\n  "properties": {\n    "name": { "type": "string", "minLength": 1 },\n    "age": { "type": "number", "minimum": 0 },\n    "email": { "type": "string", "pattern": "^[^@]+@[^@]+$" }\n  }\n}';

export function JsonSchemaValidatorTool() {
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [schemaInput, setSchemaInput] = useState(sampleSchema);

  const result = useMemo(() => {
    try {
      const data = JSON.parse(jsonInput);
      const schema = JSON.parse(schemaInput);
      const errors = validateSchema(data, schema);
      if (errors.length === 0) return "Valid! No errors found.";
      return `Found ${errors.length} error(s):\n\n${errors.map((e) => `- ${e}`).join("\n")}`;
    } catch (e) {
      return e instanceof Error ? e.message : "Parse error in JSON or schema.";
    }
  }, [jsonInput, schemaInput]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="JSON Data">
          <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className={textAreaClass} />
        </Card>
        <Card title="JSON Schema">
          <textarea value={schemaInput} onChange={(e) => setSchemaInput(e.target.value)} className={textAreaClass} />
        </Card>
      </div>
      <OutputBox value={result} label="Validation result" />
    </div>
  );
}
