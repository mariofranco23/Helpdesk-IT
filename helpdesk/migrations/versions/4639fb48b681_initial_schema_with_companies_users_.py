"""Initial schema with companies, users, tickets, messages

Revision ID: 4639fb48b681
Revises: 
Create Date: 2026-09-14 22:29:55.701017

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4639fb48b681'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('companies',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cuit', sa.String(13), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'SUSPENDED', 'INACTIVE', name='companystatus'), nullable=False),
        sa.Column('settings', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cuit')
    )
    op.create_index('ix_companies_cuit', 'companies', ['cuit'])

    op.create_table('users',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('EXTERNAL_REQUESTER', 'COMPANY_ADMIN', 'IT_AGENT', 'IT_SUPERVISOR', 'SYSTEM_ADMIN', name='role'), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', 'email', name='uq_user_company_email'),
        sa.UniqueConstraint('company_id', 'username', name='uq_user_company_username')
    )
    op.create_index('ix_users_company_id', 'users', ['company_id'])
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table('memberships',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Enum('EXTERNAL_REQUESTER', 'COMPANY_ADMIN', 'IT_AGENT', 'IT_SUPERVISOR', 'SYSTEM_ADMIN', name='role'), nullable=False),
        sa.Column('explicit_permissions', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_membership_user_company')
    )

    op.create_table('mfa_sessions',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('encrypted_secret', sa.String(255), nullable=False),
        sa.Column('recovery_codes_hash', sa.JSON(), nullable=False),
        sa.Column('enrollment_state', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table('sessions',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
    op.create_index('ix_sessions_expires_at', 'sessions', ['expires_at'])

    op.create_table('tickets',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('public_id', sa.String(20), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('type', sa.Enum('incident', 'request', 'demand', name='tickettype'), nullable=False),
        sa.Column('requester_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_to', sa.dialects.postgresql.UUID(as_uuid=True)),
        sa.Column('participants', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('category', sa.String(100)),
        sa.Column('subcategory', sa.String(100)),
        sa.Column('sector', sa.String(100)),
        sa.Column('status', sa.Enum('new', 'open', 'in_process', 'waiting_client', 'waiting_approval', 'waiting_third_party', 'resolved', 'closed', 'cancelled', name='ticketstatus'), nullable=False),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='priority'), nullable=False),
        sa.Column('impact', sa.String(50)),
        sa.Column('urgency', sa.String(50)),
        sa.Column('equipment', sa.String(255)),
        sa.Column('branch', sa.String(255)),
        sa.Column('has_cost', sa.Integer(), nullable=False),
        sa.Column('estimated_cost', sa.Integer()),
        sa.Column('approved_cost', sa.Integer()),
        sa.Column('approval_status', sa.String(20)),
        sa.Column('sla_id', sa.String(50)),
        sa.Column('first_response_due', sa.DateTime()),
        sa.Column('resolution_due', sa.DateTime()),
        sa.Column('reopens_count', sa.Integer(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('custom_data', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('first_response_at', sa.DateTime()),
        sa.Column('resolved_at', sa.DateTime()),
        sa.Column('closed_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('public_id')
    )
    op.create_index('ix_tickets_company_id', 'tickets', ['company_id'])
    op.create_index('ix_tickets_status', 'tickets', ['status'])
    op.create_index('ix_tickets_public_id', 'tickets', ['public_id'])

    op.create_table('messages',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticket_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('public_reply', 'internal_note', 'time_entry', 'status_change', 'assignment', 'approval', name='messagetype'), nullable=False),
        sa.Column('content', sa.Text()),
        sa.Column('channel', sa.Enum('web', 'email', 'whatsapp', 'phone', 'internal', name='messagechannel'), nullable=False),
        sa.Column('author_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipients', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('is_internal', sa.Boolean(), nullable=False),
        sa.Column('is_system_generated', sa.Boolean(), nullable=False),
        sa.Column('custom_data', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('delivery_status', sa.String(20), nullable=False),
        sa.Column('delivery_attempts', sa.Integer(), nullable=False),
        sa.Column('last_delivery_attempt', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_ticket_id', 'messages', ['ticket_id'])
    op.create_index('ix_messages_company_id', 'messages', ['company_id'])

    op.create_table('cost_approvals',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticket_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('concept', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('requested_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('requested_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='approvalstatus'), nullable=False),
        sa.Column('approved_by', sa.dialects.postgresql.UUID(as_uuid=True)),
        sa.Column('approved_at', sa.DateTime()),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('custom_data', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['requested_by'], ['users.id']),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('time_entries',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticket_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('work_type', sa.String(100)),
        sa.Column('description', sa.Text()),
        sa.Column('work_date', sa.DateTime(), nullable=False),
        sa.Column('billing_status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('time_entries')
    op.drop_table('cost_approvals')
    op.drop_index('ix_messages_company_id', table_name='messages')
    op.drop_index('ix_messages_ticket_id', table_name='messages')
    op.drop_table('messages')
    op.drop_index('ix_tickets_public_id', table_name='tickets')
    op.drop_index('ix_tickets_status', table_name='tickets')
    op.drop_index('ix_tickets_company_id', table_name='tickets')
    op.drop_table('tickets')
    op.drop_index('ix_sessions_expires_at', table_name='sessions')
    op.drop_index('ix_sessions_user_id', table_name='sessions')
    op.drop_table('sessions')
    op.drop_table('mfa_sessions')
    op.drop_table('memberships')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_company_id', table_name='users')
    op.drop_table('users')
    op.drop_index('ix_companies_cuit', table_name='companies')
    op.drop_table('companies')
