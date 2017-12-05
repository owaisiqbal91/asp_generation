#const width=10.
dim(0..width-1).
tile(X,Y) :- dim(X), dim(Y).
one_off(X, X+1) :- dim(X), dim(X+1).
one_off(X, Y) :- one_off(Y, X).
adj((X1, Y), (X2, Y)):- one_off(X1, X2), dim(Y).
adj((X, Y1), (X, Y2)):- one_off(Y1, Y2), dim(X).
%Entities: wall, gem, altar.
entity(wall).
entity(gem).
entity(altar).
0 { sprite(X, Y, E): entity(E) } 1:- tile(X, Y).
:- not (width*width)/2 {sprite(X, Y, wall) : tile(X, Y) }.
% No more than 1 altar.
1 { sprite(X, Y, altar) : tile(X, Y) } 1.
% No more than 1 gem.
1 { sprite(X, Y, gem) : tile(X, Y) } 1.
%:- 2 {sprite(X, Y, altar) }.
atEdge(X, 0) : dim(X).
atEdge(0, Y) : dim(Y).
atEdge(X, width-1) : dim(X).
atEdge(width-1, Y) : dim(Y).
:- sprite(X, Y, altar), atEdge(X, Y).
#show sprite/3.
