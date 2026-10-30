# C# port notes (review manually and compile in target project)

This is a conceptual C# counterpart, not a claim of full compilation in this environment.

```csharp
static float ExpCurve(float t, float k) {
    if (!float.IsFinite(t) || !float.IsFinite(k)) throw new ArgumentException();
    t = Math.Clamp(t, 0f, 1f);
    if (MathF.Abs(k) < 1e-4f) return t;
    return Math.Clamp(MathF.Expm1(k * t) / MathF.Expm1(k), 0f, 1f);
}
```

`MathF.Expm1` is not available in every target .NET/Unity version; substitute an explicitly tested stable equivalent or use an implementation with appropriate version checks. For softmax in C#, compute a double-precision max first and exponentiate `(score - max) / temperature`, not `score / temperature`. Validate that `temperature > 0`, nonempty eligible actions and RNG values are in `[0,1)`. Preserve current action only when still eligible.
