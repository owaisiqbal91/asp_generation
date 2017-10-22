%Use command clingo -n 1 initial_generation.lp --seed=%RANDOM% --rand-freq=1 --sign-def=rnd

%CONSTANTS%
terrain(forest; grassland; riverbank; hills; desert).
size(2).
animal(0..5).
species(lion; monkey; deer; crocodile; camel).
issue(waterSupply; education; vegetarianism).
score(-5..5).
stat(1..5).

%LOCATION GRAPH%
3 { location(0..5) } 3.

1 { connected(X,Y) :  location(X)} :- location(Y).

connected(X, Y) :- connected(Y, X).

:- connected(X, X).

%LOCATION ATTRIBUTES%
1{ locationAttributes(X, T, S) : terrain(T), size(S)}1 :- location(X).

%ANIMAL ATTRIBUTES%
1 {atLocation(X, Y) : location(Y)} 1 :- animal(X).
1 {ofSpecies(X, Y) : species(Y)} 1 :- animal(X).
1 {impressionable(X, P) : stat(P) } 1:- animal(X).
1 {influential(X, F) : stat(F) } 1:- animal(X).
1 {friendliness(X, F) : stat(F) } 1:- animal(X).

%ANIMAL-LOCATION%
% Counting the total number of animals per location and
% making sure it does not exceed the location's size
total(L, S) :- S = #count{ A : atLocation(A, L)}, location(L).
:- total(L, S1), locationAttributes(L, _, S2), S1 > S2.

%constraining assignment of animals to locations based on species
:- atLocation(X, L), ofSpecies(X, camel), locationAttributes(L, T, _), T != desert.


%ANIMAL-ISSUES%
1 {opinion(X, Y, S) : score(S)} 1:- animal(X), issue(Y).

% constraining opinion on issues based on species
:- opinion(X, waterSupply, S), ofSpecies(X, camel), S > 0.
:- opinion(X, vegetarianism, S), ofSpecies(X, lion), S > -2.

%#show impressionable/2.
%#show influential/2.
%#show opinion/3.
%#show ofSpecies/2.
%#show atLocation/2.
%#show locationAttributes/3.
%#show total/2.