## Jikan
[![made-with-javascript](https://img.shields.io/badge/Made%20in-JavaScript-eadc1a.svg)](https://www.javascript.com)
[![CodeFactor](https://www.codefactor.io/repository/github/fe4528/jikanrewrite/badge/main)](https://www.codefactor.io/repository/github/fe4528/jikanrewrite/overview/main)
[![min-node-version](https://img.shields.io/badge/node%20req.-20%20>=-02a262.svg)](https://nodejs.org/)</br>
[![GitHub commits](https://badgen.net/github/commits/Fe4528/JikanRewrite)](https://github.com/Fe4528/JikanRewrite/commit/)
[![GitHub latest commit](https://badgen.net/github/last-commit/Fe4528/JikanRewrite)](https://github.com/Fe4528/JikanRewrite/commit/)
[![GitHub pull-requests](https://img.shields.io/github/issues-pr/Fe4528/JikanRewrite.svg)](https://github.com/Fe4528/JikanRewrite/pull/)

# Info
This is a complete rewrite of Jikan that fixes the SQLite crisis and other unforeseen bugs in the original version. ~~This rewrite also features the use of OOP (object oriented programming) that should make my life easier.~~

# .env keys
| Key              | Info                                                         | Example                                               |
|------------------|--------------------------------------------------------------|-------------------------------------------------------|
| `BOT_TOKEN`      | Bot token provided by Discord                                | MTEyNzU1Mjc4Mzg0ODA1ODg5MA.timestamp.crypto_signature |
| `DEV_GUILD_ID`   | ID of the developer server where dev commands will be issued | 976821926678921226                                    |
| `OWNER_ID`       | ID of the owner                                              | 695154895036088384                                    |
| `MYSQL_ENDPOINT` | Your MySQL Server's Endpoint                                 | example.mysql.db.io                                   |
| `MYSQL_PORT`     | Your MySQL Server Port                                       | 3307                                                  |
| `MYSQL_USER`     | Your MySQL Server issued username                            | example_user                                          |
| `MYSQL_PASSWORD` | Your MySQL Server issued username's password                 | password67                                            |
| `MYSQL_DBNAME`   | Your MySQL Server issued database name                       | MAIN_DATABASE                                         |
| `DEVHOOK_URL`    | URL of the webhook where errors and such will be sent        | https://discord.com/api/webhooks/                     |

# checking translation keys
run "localecheck.bat" in terminal (For windows. Other OS need to use "node ./locale_check.js")
the reference is always default.json.<br><br>
reference json = default.json (English)

**Action meanings:**<br>
missing: keys that are found in reference json but missing in the translation file<br>
extra: extra keys that are found in the translation file but not found in the reference json<br>
mismatched: dynamic variable(s) in translation file does not match the one in the reference.json <br><br>
Just a quick note, dynamic variables look like this:<br>
<pre>
"Hello {0}"<br>
"Sorting by {0} from {1}.
</pre>
The 0 and 1s are to be replaced programatically, so:
<pre>
"Hello {0}" where {0} = "World"<br>--> "Hello World"<br>
"Sorting by {0} from {1}." where {0} = "VC Time"; {1} = "Local Leaderboards"<br>--> "Sorting by VC Time from Local Leaderboards"
</pre>
A mismatched key only counts if the translation file does not have the dynamic variable indication, or does not match the count of dynamic variables. example below:
<pre>
//default.json
content: "Hello {0}"

//ja.json ❌
content: "みなさん、こんにちは" // no dynamic variable
content: "こんにちは{0}と{1}" // extra dynamic variable

//ja.json ✅
content: "こんにちは{0}さん" // has dynamic variable
</pre>