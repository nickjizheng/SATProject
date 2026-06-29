# Pre-redesign UI snapshot

This branch preserves the original Ant Design interface used before the full UI redesign.

It also includes the later functional fixes for:

- server-side answer marking with database answer keys instead of guessed answers;
- synchronized SAT attempts across practice modes;
- saved accuracy and dashboard statistics;
- verified-question filtering; and
- the accepted 2,392-key 14B rerun import in `Java/database/apply_llm_answer_keys.sql`.

The answer-key migration is transactional and leaves any existing valid `A`-`D` key unchanged.

## Run locally

Start the backend from `Java`:

```bash
mvn spring-boot:run
```

Start the frontend from `SATProject`:

```bash
npm install
npm run dev
```
