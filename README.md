
Uses node v8.6, packaged with yarn.



I used nodejs exclusively as I'm familiar with it, it's a nice language for webservers, and I believe it's one of the technologies Amida uses.

I chose to write the parser in nodejs as well for ease of interoperability with the js webserver.


testing:
 - parser tested via npm test
 - the first api fetch method is testable via `curl localhost:8000/api/sample`
 - I didn't include a frontend, so uploads may be tested with `curl -XPOST localhost:8000/api/parse -d "$(cat ./parse/sample.txt)"` and checking the resulting post.json
