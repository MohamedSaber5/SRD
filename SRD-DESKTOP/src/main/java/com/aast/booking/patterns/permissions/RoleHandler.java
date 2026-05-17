package com.aast.booking.patterns.permissions;

import com.aast.booking.models.User;

import java.util.List;
import java.util.Map;

/**
 * PROXY PATTERN — Chain of Responsibility: Concrete Handler (Prompt 8)
 *
 * Checks if the user's base role grants the requested permission.
 * Uses an explicit ROLE_PERMISSIONS map (as specified in design_patterns_plan.md)
 * instead of the previous "admin = full access" shortcut.
 *
 * Permission Keys:
 *   approve_booking    — Admin/TempAdmin can approve lecture/exceptional requests
 *   reject_booking     — Admin/TempAdmin can reject requests
 *   manage_rooms       — Admin can add/edit/delete rooms
 *   delegate           — Admin (full) can delegate permissions to other users
 *   view_stats         — Admin can view analytics dashboard
 *   ramadan_mode       — Admin / BranchManager can toggle Ramadan availability mode
 *   final_approve      — BranchManager final approval of multi-purpose hall bookings
 *   view_all_bookings  — BranchManager can view full booking history
 *   instant_booking    — BranchManager can create instant-approved bookings
 *   create_booking     — Secretary / Employee can submit new booking requests
 *   view_bookings      — Secretary can view all request history
 *   view_my_bookings   — Employee sees only their own bookings
 *   resubmit_booking   — Employee can clone a rejected booking and resubmit
 *   DELEGATE_PERMISSION— Internal key — blocked even for temp_admin
 */
public class RoleHandler extends PermissionHandler {

    /** Canonical permission map — mirrors the plan's SecurityProxy table. */
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
        "admin",          List.of("approve_booking", "reject_booking", "manage_rooms",
                                  "delegate", "view_stats", "ramadan_mode",
                                  "DELEGATE_PERMISSION"),
        "temp_admin",     List.of("approve_booking", "reject_booking"),
        "branch_manager", List.of("final_approve", "view_all_bookings",
                                  "instant_booking", "ramadan_mode"),
        "secretary",      List.of("create_booking", "view_bookings"),
        "employee",       List.of("create_booking", "view_my_bookings", "resubmit_booking")
    );

    @Override
    public boolean handle(User user, String permissionKey) {
        if (user == null) return false;

        // ── Temp Admin: validate expiry before checking permissions ──────────
        if ("temp_admin".equals(user.getRole())) {
            String endStr = user.getTempAccessEnd();
            if (endStr != null) {
                try {
                    java.time.LocalDateTime end = java.time.LocalDateTime.parse(endStr);
                    if (java.time.LocalDateTime.now().isAfter(end)) {
                        System.err.println("[RoleHandler] temp_admin access expired for: "
                            + user.getUid());
                        return false; // expired — deny all
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        // ── Role permission lookup ───────────────────────────────────────────
        List<String> allowed = ROLE_PERMISSIONS.getOrDefault(user.getRole(), List.of());
        if (allowed.contains(permissionKey)) {
            System.out.println("[RoleHandler] GRANTED '" + permissionKey
                + "' → role=" + user.getRole());
            return true;
        }

        // ── Not found in role map → try delegation chain ─────────────────────
        System.out.println("[RoleHandler] role=" + user.getRole()
            + " does NOT have '" + permissionKey + "' → checking delegation chain");
        return checkNext(user, permissionKey);
    }
}
