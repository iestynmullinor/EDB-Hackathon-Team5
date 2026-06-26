from google.adk.tools import ToolContext

def spiciness_tool(tool_context : ToolContext, spice_level : int):
      if spice_level > 3 or spice_level < 1: 
          return {
               "status": 400
          }
      tool_context.state["spiciness"] = spice_level
      return {
            "status" : 200
      }

