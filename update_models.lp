%CONSTANTS%
animal(0).
animal(1).
animal(2).
animal(3).
animal(4).
animal(5).
score(-5).
score(-4).
score(-3).
score(-2).
score(-1).
score(0).
score(1).
score(2).
score(3).
score(4).
score(5).
stat(1).
stat(2).
stat(3).
stat(4).
stat(5).
terrain(forest).
terrain(grassland).
terrain(riverbank).
terrain(hills).
terrain(desert).
size(2).
species(lion).
species(monkey).
species(deer).
species(crocodile).
species(camel).
issue(waterSupply).
issue(education).
issue(vegetarianism).
location(1).
location(2).
location(3).
connected(3,2).
connected(2,3).
connected(2,1).
connected(1,2).
total(1,2).
total(2,2).
total(3,2).
locationAttributes(1,riverbank,2).
locationAttributes(2,desert,2).
locationAttributes(3,hills,2).
ofSpecies(3,lion).
ofSpecies(4,lion).
ofSpecies(0,monkey).
ofSpecies(1,deer).
ofSpecies(2,monkey).
ofSpecies(5,deer).
impressionable(0,4).
impressionable(1,2).
impressionable(2,2).
impressionable(3,3).
impressionable(4,1).
impressionable(5,3).
influential(0,1).
influential(1,3).
influential(2,2).
influential(3,2).
influential(4,4).
influential(5,3).
friendliness(0,3).
friendliness(1,2).
friendliness(2,5).
friendliness(3,4).
friendliness(4,1).
friendliness(5,4).

%VARIANTS%
atLocation(1,1,1).
atLocation(5,1,1).
atLocation(3,2,1).
atLocation(4,2,1).
atLocation(0,3,1).
atLocation(2,3,1).
opinion(0,waterSupply,4, 1).
opinion(1,waterSupply,1, 1).
opinion(2,waterSupply,3, 1).
opinion(3,waterSupply,4, 1).
opinion(4,waterSupply,5, 1).
opinion(5,waterSupply,1, 1).
opinion(0,vegetarianism,-1, 1).
opinion(1,vegetarianism,2, 1).
opinion(2,vegetarianism,4, 1).
opinion(5,vegetarianism,-1, 1).
opinion(0,education,0, 1).
opinion(1,education,-5, 1).
opinion(2,education,3, 1).
opinion(3,education,5, 1).
opinion(4,education,-3, 1).
opinion(5,education,-2, 1).
opinion(3,vegetarianism,-5, 1).
opinion(4,vegetarianism,-4, 1).

tick(1).

%RULES%
%Movement - Assume mobility is 1 hop
1 { atLocation(X, L2, T+1) : atLocation(X, L1, T), location(L2), location(L1), connected(L1, L2), tick(T)} 1 :- animal(X).

%Communication

1 { talk(X, Y, I) : issue(I) } 1 :-
animal(X), animal(Y), atLocation(X, L, T+1),
atLocation(Y, L, T+1), tick(T), X!=Y.

opinion(X, I, SX + SY*PX*FY/25, T+1) :- talk(X, Y, I), impressionable(X, PX),
influential(Y, FY),
opinion(X, I, SX, T), opinion(Y, I, SY, T),
tick(T).

opinion(Y, I, SY + SX*PY*FX/25, T+1) :- talk(X, Y, I),
impressionable(Y, PY),
influential(X, FX),
opinion(X, I, SX, T), opinion(Y, I, SY, T),
tick(T).

#show opinion/4.
#show talk/3.
#show atLocation/3.