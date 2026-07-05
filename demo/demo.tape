Output demo/demo.gif

Set FontSize 15
Set Width 1100
Set Height 760
Set Theme "Dracula"
Set Padding 18
Set TypingSpeed 45ms

Type "# a poisoned MCP server — looks normal, hides instructions in its tool metadata"
Enter
Sleep 1200ms

Type "mcpscan --cmd 'node fixtures/servers/poisoned-server.mjs'"
Sleep 600ms
Enter
Sleep 3500ms

Type "# and a clean, well-built server for contrast"
Enter
Sleep 1000ms

Type "mcpscan --file fixtures/clean-tools.json"
Sleep 600ms
Enter
Sleep 3000ms
