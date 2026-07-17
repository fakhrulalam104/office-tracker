"use client";

import { useState } from "react";
import { Card, textAreaClass, buttonClass, softButtonClass } from "./shared";

interface AcfField {
  key: string;
  label: string;
  name: string;
  type: string;
  instructions?: string;
  required?: boolean;
  conditional_logic?: unknown[][];
  sub_fields?: AcfField[];
  [key: string]: unknown;
}

interface AcfFieldGroup {
  key: string;
  title: string;
  fields: AcfField[];
  [key: string]: unknown;
}

function FieldNode({ field, depth = 0 }: { field: AcfField; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasSubFields = field.sub_fields && field.sub_fields.length > 0;
  const hasConditionalLogic = field.conditional_logic && Array.isArray(field.conditional_logic) && field.conditional_logic.length > 0;

  return (
    <div className={`${depth > 0 ? "ml-4 border-l-2 border-slate-200 pl-3" : ""}`}>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 transition ${
          expanded ? "bg-slate-50" : ""
        }`}
        onClick={() => hasSubFields && setExpanded(!expanded)}
      >
        {hasSubFields ? (
          <span className="text-slate-400 text-xs">{expanded ? "▼" : "▶"}</span>
        ) : (
          <span className="w-3" />
        )}
        <span className="font-mono text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">{field.type}</span>
        <span className="font-semibold text-sm text-slate-800">{field.label || field.name}</span>
        <span className="text-xs text-slate-400 font-mono">({field.name})</span>
        {field.required && <span className="text-xs text-red-500 font-bold">Required</span>}
        {hasConditionalLogic && <span className="text-xs text-amber-600 font-bold">Conditional</span>}
      </div>
      
      {expanded && hasSubFields && (
        <div className="mt-1">
          {field.sub_fields!.map((sub) => (
            <FieldNode key={sub.key} field={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AcfJsonViewerTool() {
  const [jsonInput, setJsonInput] = useState("");
  const [fieldGroup, setFieldGroup] = useState<AcfFieldGroup | null>(null);
  const [error, setError] = useState("");

  function parseJson() {
    try {
      setError("");
      const data = JSON.parse(jsonInput);
      
      // Handle both single field group and array of field groups
      const group = Array.isArray(data) ? data[0] : data;
      
      if (!group.fields) {
        setError("No 'fields' array found in the JSON.");
        return;
      }
      
      setFieldGroup(group);
    } catch {
      setError("Invalid JSON. Please check your input.");
    }
  }

  function loadSample() {
    const sample: AcfFieldGroup = {
      key: "group_12345678",
      title: "Page Settings",
      fields: [
        {
          key: "field_1",
          label: "Page Title",
          name: "page_title",
          type: "text",
          required: true,
        },
        {
          key: "field_2",
          label: "Subtitle",
          name: "subtitle",
          type: "textarea",
        },
        {
          key: "field_3",
          label: "Hero Section",
          name: "hero_section",
          type: "group",
          sub_fields: [
            {
              key: "field_4",
              label: "Background Image",
              name: "background_image",
              type: "image",
            },
            {
              key: "field_5",
              label: "CTA Button",
              name: "cta_button",
              type: "link",
            },
          ],
        },
        {
          key: "field_6",
          label: "Show Sidebar",
          name: "show_sidebar",
          type: "true_false",
          conditional_logic: [
            [
              {
                field: "field_3",
                operator: "!=",
                value: "",
              },
            ],
          ],
        },
      ],
    };
    setJsonInput(JSON.stringify(sample, null, 2));
  }

  return (
    <div className="space-y-5">
      <Card title="ACF JSON Field Group Viewer">
        <p className="text-sm text-slate-600 mb-4">
          Paste an exported ACF field group JSON to get a collapsible tree view of field names, types, keys, and conditional logic.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">ACF Field Group JSON</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className={textAreaClass}
              placeholder='Paste your ACF field group JSON here...'
            />
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={parseJson} className={buttonClass}>
              Parse JSON
            </button>
            <button type="button" onClick={loadSample} className={softButtonClass}>
              Load Sample
            </button>
            <button type="button" onClick={() => { setJsonInput(""); setFieldGroup(null); setError(""); }} className={softButtonClass}>
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
      </Card>

      {fieldGroup && (
        <Card title={`Field Group: ${fieldGroup.title}`}>
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-semibold">Key:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{fieldGroup.key}</code>
            <span className="ml-4 font-semibold">Fields:</span> {fieldGroup.fields.length}
          </div>
          
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {fieldGroup.fields.map((field) => (
              <FieldNode key={field.key} field={field} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}