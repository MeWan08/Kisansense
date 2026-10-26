# Native-speaker review

Translations are complete but have not been approved by native-speaking agriculture advisors. Review these keys before a public farmer-facing launch:

| Namespace / key                                      | Review focus                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| common.N, P, K                                       | Regional familiarity of नाइट्रोजन / नायट्रोजन, फॉस्फोरस / स्फुरद, पोटैशियम / पालाश; preserve the chemical symbols. |
| common.kg, mm, phUnit                                | Match actual local soil-testing report units. Confirm that users do not interpret the inputs as fertilizer doses.  |
| recommend.soilHint, climateHint, readingHint         | Clear distinction between a measurement, a seasonal average, and an application instruction.                       |
| recommend.confidence, confidenceHelp, low, lowBody   | Explain vote share without suggesting guaranteed yield; confirm district-officer referral wording.                 |
| crops.* (all 22 names)                               | Regional names, especially moth bean/मटकी, pigeon pea/तूर, black gram/उडीद, jute/ताग.                              |
| crops.rangeNote                                      | Explain descriptive middle-80% reference ranges without suggesting agronomic limits.                               |
| monitoring.driftBody, stable, warning, drifted, rule | Distinguish changing input distributions from crop disease, weather danger, and model failure.                     |
| docs.dataBody, limitsBody, useBody                   | Dataset limitations, simulated shifts, and exclusion of insurance/loan decisions.                                  |
| common.networkError, authError, timeoutError         | Comprehensibility when an advisor helps a farmer reconnect the service.                                            |

Read the full Hindi and Marathi flows aloud on a 360px screen. Check line breaks, units and numerals, not just dictionary equivalence. Save any terminology decisions in the locale JSON files and rerun the translation-completeness tests.
