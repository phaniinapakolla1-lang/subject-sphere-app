import { defineMcp } from "@lovable.dev/mcp-js";
import { auth } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import listTopics from "./tools/list-topics";
import getTopicContent from "./tools/get-topic-content";
import listPlannerSlots from "./tools/list-planner-slots";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "studyos-hub",
  title: "StudyOS Hub",
  version: "0.1.0",
  instructions:
    "StudyOS Hub study workspace tools. Use `list_courses` to browse courses and subjects, `list_topics` to find topics (supports title search), `get_topic_content` to read a topic's full study notes, and `list_planner_slots` to see upcoming planned study sessions. All tools act as the signed-in user and only see that user's data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [listCourses, listTopics, getTopicContent, listPlannerSlots],
});
