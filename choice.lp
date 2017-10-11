%CONSTANTS%
terrain(swamp; forest; grassland; riverbank; hills; desert).
size(2).
animal(0..5).
species(lion; monkey; eagle; crocodile; deer).

%LOCATION GRAPH%
3 { location(0..2) } 3.

1 { connected(X,Y) :  location(X)} :- location(Y).

:- connected(X, Y), connected(Y, X).

%LOCATION ATTRIBUTES%
1{ locationAttributes(X, T, S) : terrain(T), size(S)}1 :- location(X).

%ANIMAL ATTRIBUTES%
1 {atLocation(X, Y) : location(Y)} 1 :- animal(X).
1 {ofSpecies(X, Y) : species(Y)} 1 :- animal(X).

%ANIMAL-LOCATION%
%:- S+1 #count{atLocation(X, Y) : animal(X)}, locationAttributes(Y, _, S).
total(L, S) :- S = #count{ A : atLocation(A, L)}, location(L).
:- total(L, S1), locationAttributes(L, _, S2), S1 > S2.

#show ofSpecies/2.
%#show atLocation/2.
%#show locationAttributes/3.
%#show total/2.