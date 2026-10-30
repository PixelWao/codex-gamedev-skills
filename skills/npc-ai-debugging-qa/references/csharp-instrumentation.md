# C# integration: emit the same JSONL trace schema

This is a framework-agnostic reference, not an integrated Unity package. `System.Text.Json` availability depends on the target runtime; use an equivalent JSON serializer as appropriate.

```csharp
using System;
using System.IO;
using System.Text.Json;

public sealed class AiTraceWriter : IDisposable {
    private readonly TextWriter output;
    public AiTraceWriter(TextWriter output) { this.output = output; }
    public void Emit(string agent, double simulationTime, string kind,
                     string? node = null, string? action = null,
                     double? ms = null, string? reason = null) {
        if (double.IsNaN(simulationTime) || double.IsInfinity(simulationTime))
            throw new ArgumentException("finite simulation time required");
        output.WriteLine(JsonSerializer.Serialize(new {
            agent, t = simulationTime, kind, node, action, ms, reason
        }));
    }
    public void Dispose() { output.Flush(); }
}
```

Emit lifecycle `start`, `complete`, `abort` on *action transitions*, not on every `Tick`. A completed action does not need `abort`. Emit `cost` separately using a trustworthy CPU timing source. Do not put gameplay code inside the telemetry writer. The fixture and Python analyzer define the truth of the output schema.
