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