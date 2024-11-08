import { HomeAssistant } from 'custom-card-helpers';
import { homeAssistantWSRequest } from '..';
import { EntityCache } from './cache';
import { Entity, EntityList, entitySchema, entityListSchema } from './types.js';

// This class manages interactions with entities, caching results and fetching
// as necessary. Some calls require every entity to be fetched, which may be
// non-trivial in size (after which it is cached forever).

export class EntityRegistryManager {
  protected _cache: EntityCache;
  protected _fetchedEntityList = false;

  constructor(cache: EntityCache) {
    this._cache = cache;
  }

  public async getEntity(hass: HomeAssistant, entityID: string): Promise<Entity | null> {
    const cachedEntity = this._cache.get(entityID);
    if (cachedEntity) {
      return cachedEntity;
    }

    const entity = await homeAssistantWSRequest<Entity>(hass, entitySchema, {
      type: 'config/entity_registry/get',
      entity_id: entityID,
    });
    this._cache.set(entity);
    return entity;
  }

  public async getMatchingEntities(
    hass: HomeAssistant,
    func: (arg: Entity) => boolean,
  ): Promise<Entity[]> {
    await this.fetchEntityList(hass);
    return this._cache.getMatches(func);
  }

  public async getEntities(
    hass: HomeAssistant,
    entityIDs: string[],
  ): Promise<Map<string, Entity>> {
    const output: Map<string, Entity> = new Map();
    const _storeEntity = async (entityID: string): Promise<void> => {
      let entity: Entity | null = null;
      try {
        entity = await this.getEntity(hass, entityID);
      } catch {
        // When asked to fetch multiple entities, ignore missing entities (they
        // will just not feature in the output).
        return;
      }
      if (entity) {
        output.set(entityID, entity);
      }
    };
    await Promise.all(entityIDs.map(_storeEntity));
    return output;
  }

  public async fetchEntityList(hass: HomeAssistant): Promise<void> {
    if (this._fetchedEntityList) {
      return;
    }
    const entityList = await homeAssistantWSRequest<EntityList>(hass, entityListSchema, {
      type: 'config/entity_registry/list',
    });
    this._cache.set(entityList);
    this._fetchedEntityList = true;
  }
}
