import type { PrismClient } from "../client.js";
import type {
  AppScopeDefinition,
  AppScopeAccessRule,
  CreateAppScopeDefinitionParams,
  UpdateAppScopeDefinitionParams,
  CreateAppScopeAccessRuleParams,
} from "../types.js";

/**
 * Manages the custom permission scope definitions and access-control rules
 * that an OAuth app exposes to other apps.
 *
 * All operations require a user access token with write access to the app.
 */
export class AppScopePermissionsAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Scope definitions ──────────────────────────────────────────────────────

  /** List all scope definitions for an app. */
  async listDefinitions(
    token: string,
    appId: string,
  ): Promise<AppScopeDefinition[]> {
    const res = await this.client.request<{
      definitions: AppScopeDefinition[];
    }>("GET", `/api/apps/${appId}/scope-definitions`, { token });
    return res.definitions;
  }

  /**
   * Create or update a scope definition.
   * If a definition for this `scope` already exists it is updated in-place.
   */
  async upsertDefinition(
    token: string,
    appId: string,
    params: CreateAppScopeDefinitionParams,
  ): Promise<AppScopeDefinition> {
    const res = await this.client.request<{ definition: AppScopeDefinition }>(
      "POST",
      `/api/apps/${appId}/scope-definitions`,
      { token, body: params },
    );
    return res.definition;
  }

  /** Update the title / description of a scope definition. */
  async updateDefinition(
    token: string,
    appId: string,
    definitionId: string,
    params: UpdateAppScopeDefinitionParams,
  ): Promise<AppScopeDefinition> {
    const res = await this.client.request<{ definition: AppScopeDefinition }>(
      "PATCH",
      `/api/apps/${appId}/scope-definitions/${definitionId}`,
      { token, body: params },
    );
    return res.definition;
  }

  /** Delete a scope definition. */
  async deleteDefinition(
    token: string,
    appId: string,
    definitionId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/apps/${appId}/scope-definitions/${definitionId}`,
      { token },
    );
  }

  // ── Access rules ───────────────────────────────────────────────────────────

  /** List all scope access rules for an app. */
  async listAccessRules(
    token: string,
    appId: string,
  ): Promise<AppScopeAccessRule[]> {
    const res = await this.client.request<{ rules: AppScopeAccessRule[] }>(
      "GET",
      `/api/apps/${appId}/scope-access-rules`,
      { token },
    );
    return res.rules;
  }

  /** Create a scope access rule. Returns 409 if the rule already exists. */
  async createAccessRule(
    token: string,
    appId: string,
    params: CreateAppScopeAccessRuleParams,
  ): Promise<AppScopeAccessRule> {
    const res = await this.client.request<{ rule: AppScopeAccessRule }>(
      "POST",
      `/api/apps/${appId}/scope-access-rules`,
      { token, body: params },
    );
    return res.rule;
  }

  /** Delete a scope access rule. */
  async deleteAccessRule(
    token: string,
    appId: string,
    ruleId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/apps/${appId}/scope-access-rules/${ruleId}`,
      { token },
    );
  }
}
