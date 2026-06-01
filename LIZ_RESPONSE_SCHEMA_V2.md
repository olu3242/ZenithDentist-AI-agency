# LIZ Response Schema V2

## Status

Implemented in `lib/liz/advisor.ts`.

```ts
type LizAction = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  workflowId?: string;
  actionType:
    | "navigation"
    | "assessment"
    | "workflow"
    | "sales"
    | "support"
    | "enterprise";
  variant:
    | "primary"
    | "secondary"
    | "outline";
};

type LizResponse = {
  message: string;
  actions?: LizAction[];
  suggestedQuestions?: string[];
  escalation?: {
    type: "sales" | "support" | "enterprise";
  };
};
```

## Backward Compatibility

`LizAdvisorResponse` still includes legacy `answer` and `suggestedActions`, but the widget uses V2 `message`, `actions`, `suggestedQuestions`, and `escalation`.
