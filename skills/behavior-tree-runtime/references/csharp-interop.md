# C# translation notes (conceptual reference, not a compiled package)

Keep behavior tree statuses identical across languages. Distinguish cancellation from reinitialization:

```csharp
public enum Status { Ready, Running, Success, Failure }
public interface INode {
    Status Tick(in DecisionContext ctx);
    void Abort(in DecisionContext ctx); // release reservations and running tasks
    void Reset(in DecisionContext ctx); // Abort if running; transient state only
}
```

Store combat cooldown by absolute monotonic simulation time, **not** in a transient `Reset()` field:

```csharp
sealed class CooldownState {
    public double ReadyAt = double.NegativeInfinity;
    public bool IsReady(double now) => now >= ReadyAt;
    public void Trigger(double now, double seconds) => ReadyAt = now + seconds;
}
```

In `Sequence`, keep current index while Running, but clear indices and child state before a *new* run. For reactive priority checks, abort the previously running lower-priority branch before issuing a new lower-level command. Parallel composites must latch completed children until the parent returns terminal. Tests supplied in JS exercise these behaviors; port tests alongside any C# implementation. Do not share per-agent mutable node state between entities.
