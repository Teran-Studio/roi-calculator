# roi-calculator

How much does the manual work between your ERP and CRM cost per year? This calculator estimates it from one repetitive process: order entry, customer creation or invoice reconciliation.

You enter four numbers. It returns the annual cost, the range you could recover and an integration risk score. Everything runs in the browser. There is no server, no tracking and no network request.

Live version: [prietoteran.com/tools/erp-crm-roi-calculator.html](https://www.prietoteran.com/tools/erp-crm-roi-calculator.html)

## Run it

It is a static page with ES modules, so it needs a local web server (opening the file directly does not load modules).

```bash
python3 -m http.server 8080    # then open http://localhost:8080
npm test                       # Node 20+, no dependencies
```

## The model

All formulas are in [`src/calculator-core.mjs`](src/calculator-core.mjs) and covered by tests.

| Output | Formula |
|---|---|
| Manual hours / year | transactions per month × minutes each / 60 × 12 |
| Labor cost | manual hours × hourly cost |
| Error cost | transactions per month × error rate × 12 × cost per error |
| Annual waste | labor cost + error cost |
| Recoverable range | 30% to 60% of the annual waste |
| Risk score (0 to 100) | connected systems + error rate + sync frequency + monitoring + manual handoffs, each worth up to 20 points |

Risk bands: low below 30, moderate below 60, high below 80, critical from 80.

Inputs outside the documented limits are rejected, not clamped. The recoverable range is an assumption, not a measured result. Freed capacity is not cash savings unless it avoids overtime, hiring or other costs.

## Files

| Path | Content |
|---|---|
| `index.html` | The page |
| `src/calculator-core.mjs` | The model, no DOM |
| `src/app.mjs` | Form handling and rendering |
| `style.css` | Styles, light and dark |
| `tests/` | Model tests |

## Help with the real process

The calculator gives a first number. Working out where the bottleneck is and what to automate first needs the real process. Get in touch: [prietoteran.com](https://www.prietoteran.com/).

## License

[Apache License 2.0](LICENSE)
