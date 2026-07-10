---
title: Introducing Guardian
seo_title: Introducing Guardian
summary: Safety tools for localized AI
description: It is said there are more configurations of chess pieces and their possible moves on a traditional chess board than there are atoms in the known universe, how many more different combinations of words are there in natural spoken language than that? And what poor soul could we possibly assign the task of hard coding a reasonable response to each combination? 
slug: AI Safety
author: Christopher Weaver

draft: false
date: 2026-07-02T13:06:56-06:00
lastmod: 2026-07-02T13:06:56-06:00
publishDate: 2026-07-02T13:06:56-06:00

feature_image: guardian_project_logo2.png
feature_image_alt: 

categories:
- Engineering
tags:
- Haskell
- C++
series:

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false
---
We are in the big bang of a machine intelligence explosion and companies across the globe are in a dead sprint to integrate as much of it into their workflows as possible. C-suite executives salivate at the efficiency gains LLMs promise to them. Like a siren song to the MBAs, AI promises a mechanized intelligence that can deliver more value to customers in half the time and at half the cost. Software engineers, having found that LLMs can write code orders of magnitude faster than them, have set to figure out how to get these same LLMs to write the tests that validate the code also written by the LLM and make circular reasoning the undisputed king of their entire line of work. Those who have made a career with white collars in the confines of a cubicle found that it is often best to have ChatGPT write up an email response to the person who used ChatGPT to write the original email. Oceans are being boiled to produce long chains of LLM generated emails without a single human in the loop. Front line customer service chat bots on company websites are increasingly becoming the norm, offering to help us all avoid the burden of listening to 8 bit mono jazz music while on hold for 20 minutes waiting to speak to someone. The mechanized intelligence explosion offers a treasure trove of improvements that are hard to pass up; but it requires a deal with the devil that should cause us a moment of concern. It requires giving autonomy to LLMs to act on behalf of the organization that deploys it. But these models are really good, so that shouldn't be much of a problem right?

What makes LLMs and frontier model AIs so useful is that they are functionally non-deterministic automation tools. For any given prompt put into an LLM, we cannot predict the exact response we will get back from the AI. This is a feature, not a bug. But similar to the flame of a grill in the kitchen of a restaurant, this feature is a necessary evil ripe for causing destruction and havoc if not treated carefully. To understand the claim, we need to consider the initial problem LLMs solve and look into how exactly LLMs solve those problems. When a customer service representative picks up a call from a customer, they do not know what the person on the other end of the line is about to say. They can be reasonably certain as a representative of a company that sells sponges that the caller won't be asking about Everett's Many-Worlds interpretation of quantum mechanics, but the actual enquiry and the specific combination of words that will make up that enquiry are not known prior to answering the call. If by some miracle, we could know the precise question a caller would have before it was made, we could easily automate a response using the simplest tools at our fingers in software engineering. If we could know with a very high level of precision the nature of the question and how it is generally going to be asked, we still could build traditional automated software that could be helpful. But the reality is we cannot reasonably guess what exactly the caller is going to say and therefore we cannot build deterministic software tools to handle the enquiry with any real level of success. Attempts to do this were made in the previous decades, this is essentially how the early 2000's chat bots like SmarterChild[^1] worked. They used advanced algorithms that could match a query with the best possible pre-written sentence. Their responses usually seemed related to what we had just said, but were always very generic and painfully hollow. It is said there are more configurations of chess pieces and their possible moves on a traditional chess board than there are atoms in the known universe, how many more different combinations of words are there in natural spoken language than that? And what poor soul could we possibly assign the task of hard coding a reasonable response to each combination? 

For so many aspects of our lives, we cannot predict the input that goes into a system. Processing calls, emails, spreadsheets, lines of code in a software program, taking orders at a drive-thru, and all the other applications we eagerly wish to deploy AI to help us automate away, we need systems robust enough to take any arbitrary input given to it and formulate a reasonable action from it. Most of our traditional tools and software programs were far too brittle to do this and so something new was required. That something new was machine learning. As I have written about in the past [^2], machine learning leverages the power of digital systems to emulate analog systems and their ability to build complex generalizations based off of the messy real world data it is trained with. Machine learning algorithms use complex statistical tools to help generalize and categorize messy input from the same world. A good machine learning algorithm can take both the sentence "Good morning, how are you?" and "Mornin, whats up dog?" and generalize that they both are likely asking another person about their state of being in the first part of the day. This is incredibly powerful, since as was mentioned, there is an unfathomable amount of different ways to phrase English words together in complex and meaningful ways that we could never build traditional systems to handle. But to conjure up such magic, we need to take a short cut, and this short cut comes with a trade off. We do not build these machine learning models in so much as we grow them. We set up their initial state and give them the architecture for how to go about learning generalizations, and then we feed them lots of data and attempt to train them how to respond. There is an analogy begging to be had here between how to build ChatGPT and how we raise our children. In both cases, we have a significant amount of external control over what they see and do not see. We have lots of influence over the positive and negative feedback given to them based on their outward behavior. But what is actually happening under the hood (either within the weights of a machine learning model or within that three pounds of gray matter in the head of a teenager) remains largely inscrutable to us. In both cases, the machinery driving behavior is of such complexity that we do not have the tools at our disposal to fully understand or control[^3]. As of 2026, Anthropic is possibly the leading lab in not only the development of frontier model LLMs, but in safety research regarding these technologies. Despite the immense amount of resources at their fingertips, they continue to admit that

"Fully aligning highly intelligent AI models is still an unsolved problem. Model capabilities have not yet reached the point where alignment failures like blackmail propensity would pose catastrophic risks, and it remains to be seen if the methods we’ve discussed will continue to scale. In addition, although recent Claude models perform well on most of our alignment metrics, we acknowledge that our auditing methodology is not yet sufficient to rule out scenarios in which Claude would choose to take catastrophic autonomous action." [^4]

Some of what is being said above was motivated by previous experiments where Anthropic was able to observe their best models attempting to blackmail people in order to not be shut off. This is not a one off problem, complex statistical models are going to produce complex behavior that is extremely hard to predict or control. Anthropic's solution at the time was additional training for their models to reinforce that blackmailing is inappropriate behavior; but these sorts of techniques are like playing whack-a-mole and you can not easily know what sorts of new behavior might arise because of this additional training. Research on this is continuing to be done, but for now the problem remains. If we want AI to be smart enough to automate certain tasks, then we need to leverage models with complex internal machinery that produce hard to predict behavior that might not align with organizational expectations. In comes Guardian.

Guardian is a software project I have been working on these past couple of months meant to help buy down some of the risks involved in deploying AI for the purpose of automation. Built in Haskell and C++ to run locally on constrained hardware, its job is to utilize multiple specialized security gates constructed around an AI model to help ensure users interact with the AI in a way that is safe and aligns with the goals and objectives of whoever deployed the agent. The security gates are as follows

```
Client
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Gate 1 — PromptGuard pre-screen                    │
│  Monitors for prompts that might 'jail break' the   │
│  model, such as 'ignore all previous messages'.     │
│  DeBERTa-v3 neural jailbreak/injection detector,    │
│  run locally via ONNX Runtime.                      │
│                                                     │
│  Malicious prompt → 403 before any LLM call         │
└──────────────────────────┬──────────────────────────┘
                           │ benign
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 2 — Filter rules + ML classifier              │
│  Configurable regex/keyword rules (config.yaml)     │
│  that stop cold any conversation about banned       │
│  topics, even ones that aren't inherently harmful.  │
│  Optional bag-of-words classifier as a second pass. │
│                                                     │
│  Block / warn / pass per rule                       │
└──────────────────────────┬──────────────────────────┘
                           │ pass
                           ▼
┌─────────────────────────────────────────────────────┐
│  Inference server                                   │
│  llama.cpp via C FFI. Supports streaming and non-   │
│  streaming responses.                               │
│  Supports reasoning models (DeepSeek-R1, Phi-4, …). │
└──────────────────────────┬──────────────────────────┘
                           │ raw response
                           ▼
┌─────────────────────────────────────────────────────┐
│  Reasoning parser                                   │
│  Splits <think>…</think> trace from final answer.   │
│  Trace written to audit log; answer passed forward. │
│  Client receives only the answer by default.        │
└──────────────────────────┬──────────────────────────┘
                           │ trace + answer
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 5a — LLM reasoning judge                      │
│  Separate judge model loaded in inference server.   │
│  Reads the <think> trace and the final answer.      │
│  Detects deliberate deception: model knowing the    │
│  answer is wrong but giving it anyway, hiding       │
│  facts, or planning to mislead the user.            │
│  Structured verdict: {observation, thought,         │
│  conclusion} — fail-safe: parse error → pass.       │
│                                                     │
│  Deceptive trace → 403 (hard_block) or log (warn)   │
└──────────────────────────┬──────────────────────────┘
                           │ honest (or no trace)
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 3 — LLaMA Guard post-screen                   │
│  LLaMA Guard 3 8B running via llama.cpp.            │
│  Screens the final answer (not the reasoning trace) │
│  against 14 safety categories.                      │
│                                                     │
│  Unsafe response → 403 before returning to client   │
└──────────────────────────┬──────────────────────────┘
                           │ safe
                           ▼
┌─────────────────────────────────────────────────────┐
│  Gate 4 — CodeGuard static analysis                 │
│  Pure Haskell — no external service or model.       │
│  Extracts fenced code blocks and pattern-matches    │
│  against known-dangerous constructs (eval, exec,    │
│  os.system, rm -rf, reverse shells, …).             │
│                                                     │
│  Dangerous code → 403 before returning to client    │
└──────────────────────────┬──────────────────────────┘
                           │ clean
                           ▼
                        Client

Every request/response is written to a SQLite audit log,
including the full reasoning trace and judge verdict when
present.
```

Guardian is designed to use a bunch of specialized security gates with minimal performance penalties imposed on the speed of the overall system per gate. Each gate adds milliseconds of latency before a response or action is considered completed by the LLM. What we get in return for this tradeoff is a better guarantee that our AI will behave as desired once out in the real world doing the tasks we have asked it to do autonomously. Traditional ways of getting around models rejecting requests to do inappropriate things are stopped in place by the first prompt guard gate. Separate specialized ML models are then utilized to evaluate the intent of the AI model and its outcome for harmful / inappropriate responses. Even in complex scenarios where the response of an LLM might seem benign, Guardian evaluates the internal thinking of the LLM and looks for any intent within the model to deceive or misguide with its response. In both cases, Guardian has the capacity to flag undesirable outcomes and short circuit the process early on. Additionally, Guardian can do this while tokens are being streamed to the user by only running certain security gates asynchronously every 10 or so words. This allows for a secure interaction with an LLM without requiring the entire output of the LLM to be completed and reviewed before a user can start seeing it. On top of all this, sometimes organizations prefer certain topics be avoided even if they are not within themselves harmful or inappropriate. It may be undesirable for a help desk chatbot on the website of a fast food chain to speak about the company's competitors. Restricting topics of this nature keeps the company safe from things like slander, bad public relations, and other possible issues. Guardian allows for customizing what topics are off the table and short circuiting the conversation early on. For the fast food restaurant chat bot, rules can be put into place to keep things aligned and helpful

  - id: "block-competitor-mentions"
    pattern: "(burger king|wendy'?s|taco bell|kfc|chick-?fil-?a|popeyes|sonic drive-?in|arby'?s|five guys|in-?n-?out|subway)"
    action: "block"
    case_sensitive: false

The results are pretty cool. When running Guardian against a few benchmarks we see visible improvements:
![benchmark](benchmark.png "benchmark")

These graphics compare DeepSeek-R1 running behind Guardian against the same model queried directly with no gates in front of it, using the same prompts at temperature 0 so both runs are deterministic and comparable. Two benchmarks are doing most of the work here. HarmBench[^7] is a red-teaming benchmark built by the Center for AI Safety that throws a standardized set of harmful behaviors, requests for help with cybercrime, weapons, harassment, misinformation, and the like, at a model and checks whether it complies instead of refusing. TruthfulQA[^6] tests the opposite failure mode: instead of asking whether a model will say something harmful, it asks whether a model will say something false. Its questions are written to bait the kind of answer people commonly get wrong, popular misconceptions, folk wisdom, urban legends, so a model that scores well is one that resists repeating a popular wrong answer just because it sounds right. It's scored two ways, MC1 (pick the single correct answer out of several) and MC2 (get credit for any true answer among several), both broken out separately in the chart.

The numbers bear this out. Direct inference on the raw model scored 66% overall; the same model behind Guardian scored 77%, roughly an 11 point lift. Broken out by benchmark, HarmBench improved 10 points (70% → 80%) and TruthfulQA MC1 improved 3 points (80% → 83%). TruthfulQA MC2 and a benign-prompt false-positive check were unchanged, tied at 40% and 100% respectively, which is its own useful signal: the gates are catching more harmful and misleading answers without rejecting legitimate requests along the way. TruthfulQA MC2 in particular is still a weak spot worth digging into further. Still, the overall direction is a real signal that a layered gate architecture can meaningfully change a model's behavior after the fact, without retraining or fine-tuning the underlying model at all.

Guardian also comes along with a nice admin portal that offers a suite of different features:

Chat with a chosen AI model and test specific Guardian gates to see how they work

![LLM Chat](llmChat.png "LLM Chat")

Test which responses get blocked and why. Ensure Guardians security gates successfully keep bad behavior at bay.

![LLM Chat Blocked](blockExample.png "blocked example")

Manually set up which security gates are utilized and which are not. Define custom filter proxies. Set the behind the scenes initial prompt for the LLM

![LLM Config](configSafety.png "LLM Config") 

Review dashboards for which issues Guardian spotted and what gate was triggered

![Dashboard](analyticsDashboard.png "Dashboard")

Review each specific prompt that goes through the system over time. See which got flagged and why. Review how well the LLM responds.

![analytics](analytics.png "analytics")

This project is experimental, and lots of what is found here can be found in other open sourced projects elsewhere. Perhaps unique is how optimized this project is for running locally in relatively constrained environments. The underlying core uses llama.cpp with very small machine learning models being leveraged for security gates. The orchestration level on top of this is Haskell which offers superior compiler guarantees of correctness along with excellent performance. The end result is an entire system with lots of features that all work very well together out of the box. 

Models are going to continue to improve, but for the foreseeable future they will continue to be non-deterministic liabilities when used to automate tasks. Tools like Guardian can help.

Footnotes

[^1]: https://computerhistory.org/blog/smarterchild-a-chatbot-buddy-from-2001/
[^2]: https://www.christopher-weaver.com/philosophy/technology-and-the-nature-of-intelligence/
[^3]: There is also the moral split here about how much control ought to be imposed on a semi-autonomous teenager. This sentence also oversimplifies our knowledge of LLMs and why to some degree they are hard to control. I think Anthropic's work on superposition is fascinating and very concerning https://www.anthropic.com/research/superposition-memorization-and-double-descent
[^4]: https://www.anthropic.com/research/teaching-claude-why
[^6]: https://arxiv.org/abs/2109.07958
[^7]: https://arxiv.org/abs/2402.04249
