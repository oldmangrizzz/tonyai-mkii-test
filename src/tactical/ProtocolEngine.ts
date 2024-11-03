import { EventEmitter } from 'events';
import { TacticalCore } from './TacticalCore';

interface Protocol {
  id: string;
  name: string;
  type: 'standard' | 'emergency' | 'custom';
  steps: ProtocolStep[];
  conditions: ProtocolCondition[];
}

interface ProtocolStep {
  id: string;
  action: string;
  parameters: Record<string, any>;
  nextSteps: string[];
  completionCriteria?: ProtocolCondition[];
}

interface ProtocolCondition {
  type: 'environmental' | 'tactical' | 'temporal';
  operator: 'equals' | 'greater' | 'less' | 'contains';
  value: any;
}

export class ProtocolEngine extends EventEmitter {
  private protocols: Map<string, Protocol>;
  private activeProtocols: Map<string, string[]>; // protocolId -> active step IDs
  private tacticalCore: TacticalCore;

  constructor(tacticalCore: TacticalCore) {
    super();
    this.protocols = new Map();
    this.activeProtocols = new Map();
    this.tacticalCore = tacticalCore;
    
    this.tacticalCore.on('situation:updated', this.evaluateProtocols.bind(this));
  }

  async loadProtocol(protocol: Protocol) {
    this.validateProtocol(protocol);
    this.protocols.set(protocol.id, protocol);
    this.emit('protocol:loaded', { id: protocol.id, name: protocol.name });
  }

  private validateProtocol(protocol: Protocol) {
    // Ensure protocol structure is valid
    if (!protocol.steps.length) {
      throw new Error(`Protocol ${protocol.id} must have at least one step`);
    }

    // Validate step references
    const stepIds = new Set(protocol.steps.map(s => s.id));
    protocol.steps.forEach(step => {
      step.nextSteps.forEach(nextId => {
        if (!stepIds.has(nextId)) {
          throw new Error(`Invalid step reference ${nextId} in protocol ${protocol.id}`);
        }
      });
    });
  }

  async activateProtocol(protocolId: string, context: any = {}) {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) throw new Error(`Protocol ${protocolId} not found`);

    // Check if conditions are met
    const conditionsMet = protocol.conditions.every(condition =>
      this.evaluateCondition(condition, context)
    );

    if (!conditionsMet) {
      throw new Error(`Conditions not met for protocol ${protocolId}`);
    }

    // Start with first step
    const activeSteps = [protocol.steps[0].id];
    this.activeProtocols.set(protocolId, activeSteps);
    
    await this.executeProtocolStep(protocol, protocol.steps[0], context);
    this.emit('protocol:activated', { id: protocolId, initialStep: protocol.steps[0].id });
  }

  private async executeProtocolStep(
    protocol: Protocol,
    step: ProtocolStep,
    context: any
  ) {
    try {
      // Execute step action
      await this.executeAction(step.action, step.parameters, context);

      // Check completion criteria
      const isComplete = !step.completionCriteria || 
        step.completionCriteria.every(condition =>
          this.evaluateCondition(condition, context)
        );

      if (isComplete) {
        await this.progressProtocol(protocol, step, context);
      }

      this.emit('step:executed', {
        protocolId: protocol.id,
        stepId: step.id,
        complete: isComplete
      });
    } catch (error) {
      this.emit('step:error', {
        protocolId: protocol.id,
        stepId: step.id,
        error
      });
    }
  }

  private async progressProtocol(
    protocol: Protocol,
    currentStep: ProtocolStep,
    context: any
  ) {
    const activeSteps = this.activeProtocols.get(protocol.id) || [];
    
    // Remove current step
    const updatedSteps = activeSteps.filter(id => id !== currentStep.id);
    
    // Add next steps
    updatedSteps.push(...currentStep.nextSteps);
    this.activeProtocols.set(protocol.id, updatedSteps);

    // Execute next steps
    await Promise.all(
      currentStep.nextSteps.map(async (nextId) => {
        const nextStep = protocol.steps.find(s => s.id === nextId);
        if (nextStep) {
          await this.executeProtocolStep(protocol, nextStep, context);
        }
      })
    );
  }

  private async executeAction(
    action: string,
    parameters: Record<string, any>,
    context: any
  ) {
    // Implementation would depend on your specific action types
    switch (action) {
      case 'mark_location':
        await this.tacticalCore.addTacticalElement(
          'operations',
          {
            type: 'marker',
            position: parameters.position,
            metadata: {
              ...parameters.metadata,
              timestamp: Date.now()
            }
          }
        );
        break;
      
      case 'update_situation':
        await this.tacticalCore.updateSituationalAwareness(
          parameters.center,
          parameters.radius
        );
        break;
      
      // Add more action types as needed
    }
  }

  private evaluateCondition(
    condition: ProtocolCondition,
    context: any
  ): boolean {
    const actualValue = this.getContextValue(condition.type, context);
    
    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'greater':
        return actualValue > condition.value;
      case 'less':
        return actualValue < condition.value;
      case 'contains':
        return Array.isArray(actualValue) && 
          actualValue.includes(condition.value);
      default:
        return false;
    }
  }

  private getContextValue(type: string, context: any): any {
    switch (type) {
      case 'environmental':
        return context.environmental;
      case 'tactical':
        return context.tactical;
      case 'temporal':
        return Date.now();
      default:
        return null;
    }
  }

  private async evaluateProtocols(situationUpdate: any) {
    // Re-evaluate all active protocols with new situation
    for (const [protocolId, activeSteps] of this.activeProtocols) {
      const protocol = this.protocols.get(protocolId);
      if (!protocol) continue;

      const context = {
        ...situationUpdate,
        activeSteps
      };

      // Check if protocol should remain active
      const conditionsMet = protocol.conditions.every(condition =>
        this.evaluateCondition(condition, context)
      );

      if (!conditionsMet) {
        this.deactivateProtocol(protocolId);
        continue;
      }

      // Re-evaluate active steps
      await Promise.all(
        activeSteps.map(async (stepId) => {
          const step = protocol.steps.find(s => s.id === stepId);
          if (step) {
            await this.executeProtocolStep(protocol, step, context);
          }
        })
      );
    }
  }

  private deactivateProtocol(protocolId: string) {
    this.activeProtocols.delete(protocolId);
    this.emit('protocol:deactivated', { id: protocolId });
  }
}</content>