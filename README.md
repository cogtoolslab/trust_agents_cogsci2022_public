# Evaluating the competence of artificial agents in a physical environment
***

**This project is motivated by the question of how people develop trust with artificial agents.**

![agent_suggestion](img/cliphy-suggestion-submit.gif)

## Overview
***

In this work, we focus on judgments of an agent's *competence* over repeated interactions, which undergird our trust in those agents in many settings (e.g., how much we trust an autonomous vehicle may depend on how well we think it can overcome various driving obstacles).

The current study focuses on people's judgments of competence in an intuitive physical setting, using their decisions about whether to intervene, and how much, on an agent's move suggestions. We examine these judgments for agents that vary in their underlying task ability, as well as their *learning over time* (improving and worsening).

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

Notes on experiment code:
1. The experiment code relies on an exchange with a mongodb instance running on the cogtoolslab server.
    - As a result, the code here is not likely to run if simply cloned and started locally; however, the underlying logic of the experiment (as well as all stimuli etc.) is preserved in `/experiments`.
2. The code here largely inherits from an earlier experiment lead by Haoliang Wang examining people's ability to learn novel physical dynamics over repeated trials. This code has primarily been modified to include the agent's suggestions and the logic of intervening on or accepting them.
