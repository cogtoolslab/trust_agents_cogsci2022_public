# trust_agents_cogsci2022_public




## Organization

`/data`: Data files for the complete experiment
- `physics_continual_learning_trialdata_e2_full.csv`: Experiment trial data (game responses)
- `physics_continual_learning_surveydata_e2_full.csv`: Post-experiment survey data

`/analysis`: Analysis scripts and output (figure images)
- `analysis-cogsci2022.ipynb`: Primary analysis script for the Cog Sci 2022 write-up
- `/figures`: Sub-directory for figure images used in the Cog Sci 2022 write-up

`/experiments`: Code for running experiment
- NOTE: Original experiment relies on an exchange with a mongodb instance running on the cogtoolslab server. 
- For that reason, the code here is not likely to run if simply cloned and run locally.
- However, the code here makes the underlying logic in the experiment transparent.
