# Evaluating the competence of artificial agents in a physical environment
***

**This project is motivated by the question of how people develop trust with artificial agents.**

![agent_suggestion](img/cliphy-suggestion-submit.gif)

## Overview
***

In this work, we focus on judgments of an agent's *competence* over repeated interactions, which undergrid our trust in those agents in many settings (e.g., how much we trust an autonomous vehicle may depend on how well we think it can overcome various driving obstacles).

The current study focuses on people's judgments of competence in an intuitive physical setting, using their decisions about whether to intervene, and how much, on the agent's move suggestions. We examine these judgments for agents that vary in their underlying task ability, as well as their *learning over time* (improving and worsening).

The final write-up for the *CogSci 2022* conference is included in this directory and can be found [here](Revisions-final.pdf).

## Organization
***

### Data
`/data`: Contains data files for the complete experiment
- `physics_continual_learning_trialdata_e2_full.csv`: Experiment trial data (game responses)
- `physics_continual_learning_surveydata_e2_full.csv`: Post-experiment survey data

### Analysis
`/analysis`: Contains analysis scripts and output (incl. figure images)
- `analysis-cogsci2022.ipynb`: Primary analysis script for the Cog Sci 2022 write-up
- `/figures`: Sub-directory for figure images used in the Cog Sci 2022 write-up

### Experiment
`/experiments`: Code for running experiment
- NOTE: Original experiment relies on an exchange with a mongodb instance running on the cogtoolslab server.
- For that reason, the code here is not likely to run if simply cloned and run locally.
- However, the code here makes the underlying logic in the experiment transparent.
